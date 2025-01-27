import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Producer } from "../producer";
import { AngularFireDatabase } from '@angular/fire/database';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { DataService } from '../data.service';
import { take } from 'rxjs/operators';
import { Application } from '../application';

@Component({
  selector: 'app-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.scss']
})
export class MainViewComponent implements OnInit {

  app_types = ["life", "auto", "bank", "fire", "health", "mutual-funds"];
  app_totals_by_producer = {};
  app_totals_by_co_producer = {};
  app_totals = {};
  life_dots = {};
  auto_dots = {};
  bank_dots = {};
  fire_dots = {};
  health_dots = {};
  mutual_funds_dots = {};
  life_premiums = {};
  life_annuities = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  life_totals = {"year": 0};
  auto_totals = {"year": 0};
  bank_totals = {"year": 0};
  fire_totals = {"year": 0};
  health_totals = {"year": 0};
  mutual_funds_totals = {"premium": 0};

  goals = {
    "life": {},
    "auto": {},
    "bank": {},
    "fire": {},
    "health": {},
    "mutual-funds": {}
  };

  producers: Producer[] = [];

  month_number = 0;
  year = 0;
  current_year = 0;
  current_month = "";
  monthForm: FormGroup = this.fb.group({ });
  months = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
  selected_month = 1;

  addNoteForm = this.fb.group({
    note: []
  });
  notes = [];
  selected_note_id = "";

  active_page = 'summary';

  printing_report = false;

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, private dataService: DataService, public db_auth:  AngularFireAuth, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    let today = new Date();
    this.current_year = today.getFullYear();
    if (!this.route.snapshot.paramMap.get('year')) {
      // reroute to home page url with year in it
      this.router.navigate(['home/' + this.current_year]);
    }
    this.year = parseInt(this.route.snapshot.paramMap.get('year'));

    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        // this.year = today.getFullYear();
        this.selected_month = today.getMonth() + 1;

        this.loadProducers();
      } else {
        // if user is not logged in, reroute them to the login page
        this.router.navigate(['login']);
      }
    });
    
    if (this.year < today.getFullYear()) {
      // user is viewing past year
      this.current_month = this.months[11];
      this.month_number = 12;
    } else {
      this.current_month = this.months[today.getMonth()];
      this.month_number = today.getMonth() + 1;
    }
    
    this.monthForm = this.fb.group({
      month: [this.month_number]
    });
  }

  async loadProducers() {
    await this.dataService.until(_ => this.dataService.prod_loaded == true);

    for (const producer of this.dataService.producers) {
      if (producer.hired && producer.licensed) {
        this.app_totals_by_producer[producer["id"]] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.app_totals_by_co_producer[producer["id"]] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.app_totals[producer["id"]] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        this.producers.push(producer);
      }
    }

    await this.dataService.until(_ => this.dataService.apps_loaded_by_year.has(this.year));
    this.loadDots();
    this.loadNotes();
  }

  loadDots() {
    this.app_totals["year"] = 0;

    // loads in application totals for the year
    for (const app_type in this.dataService.applications[this.year]) {
      let apps: Application[] = this.dataService.applications[this.year][app_type];
      this.app_totals["year"] += apps.length;

      for (const app of apps) {
        if (parseInt(app.date.substring(0, 4)) != this.year || app["status"] == "Cancelled" || app["status"] == "Declined") {
          continue;
        }

        const type = app["type"];
        const issue_month = app["issue_month"];
        const month = Number((app.date as string).substring(5, 7));

        const app_year = parseInt(app.date.substring(0, 4));
        let app_month: number = Number(app.date.substring(5, 7)) - 1;
        let app_day: number = Number(app.date.substring(8, 10));
        let app_date_obj = new Date(app_year, app_month, app_day);

        if (type == "life") {
          if (app["policy_type"] != "Annuity") {
            this.life_totals[month+"_total"] = (this.life_totals[month+"_total"] || 0) + 1;
            if (this.inCurrentWeek(app_date_obj)) {
              this.life_totals["week"] = (this.life_totals["week"] || 0) + 1;
            }
          } else {
            this.life_annuities[month] += 1
          }

          this.life_dots[app["producer_id"]+"_"+month+"_total"] = (this.life_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 1;
          this.life_premiums[month+"_total"] = (this.life_premiums[month+"_total"] || 0) + app["premium"];
          if (app["status"] == "Taken") {
            if (app["policy_type"] != "Annuity") {
              this.life_totals["year"] += 1;
              this.life_totals[month+"_issued"] = (this.life_totals[month+"_issued"] || 0) + 1;
            }
            this.life_dots[app["producer_id"]+"_"+month+"_issued"] = (this.life_dots[app["producer_id"]+"_"+month+"_issued"] || 0) + 1;
            this.life_premiums[month+"_issued"] = (this.life_premiums[month+"_issued"] || 0) + app["premium"];
            if (app["issue_month"] != "") {
              this.life_dots[app["producer_id"]+"_"+issue_month+"_bonus"] = ((this.life_dots[app["producer_id"]+"_"+issue_month+"_bonus"] * 100 || 0) + app["paid_bonus"] * 100) / 100;
              if (app["co_producer_id"] != "") {
                this.life_dots[app["co_producer_id"]+"_"+issue_month+"_bonus"] = ((this.life_dots[app["co_producer_id"]+"_"+issue_month+"_bonus"] * 100 || 0) + app["co_producer_bonus"] * 100) / 100;
              }
            }
          }
        }
        //console.log("Life");
        //console.log(this.life_totals);

        if (type == "auto") {
          if (app["co_producer_id"] == "") {
            this.auto_dots[app["producer_id"]+"_"+month+"_total"] = (this.auto_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 1;
          } else {
            // if there is a co-producer, then split app count
            this.auto_dots[app["producer_id"]+"_"+month+"_total"] = (this.auto_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 0.5;
            this.auto_dots[app["co_producer_id"]+"_"+month+"_total"] = (this.auto_dots[app["co_producer_id"]+"_"+month+"_total"] || 0) + 0.5;
          }
          this.auto_totals[month+"_total"] = (this.auto_totals[month+"_total"] || 0) + 1;
          this.auto_totals["year"] += 1;
          if (this.inCurrentWeek(app_date_obj)) {
            this.auto_totals["week"] = (this.auto_totals["week"] || 0) + 1;
          }

          if (app["auto_type"] == "RN") {
            this.auto_dots[app["producer_id"]+"_"+month+"_RN"] = (this.auto_dots[app["producer_id"]+"_"+month+"_RN"] || 0) + 1;
            this.auto_totals[month+"_RN"] = (this.auto_totals[month+"_RN"] || 0) + 1;
          } else {
            this.auto_totals[month+"_other"] = (this.auto_totals[month+"_other"] || 0) + 1;
          }
          if (app["status"] == "Submitted" || app["status"] == "Issued") {
            this.auto_dots[app["producer_id"]+"_"+month+"_bonus"] = ((this.auto_dots[app["producer_id"]+"_"+month+"_bonus"] * 100 || 0) + app["bonus"] * 100) / 100;
          }
        }
        //console.log("Auto");
        //console.log(this.auto_dots);

        if (type == "fire") {
          this.fire_totals[month+"_total"] = (this.fire_totals[month+"_total"] || 0) + 1;
          this.fire_totals["year"] += 1;
          if (this.inCurrentWeek(app_date_obj)) {
            this.fire_totals["week"] = (this.fire_totals["week"] || 0) + 1;
          }

          if (app["status"] == "Submitted" || app["status"] == "Issued") {
            if (app["co_producer_id"] == "") {
              this.fire_dots[app["producer_id"]+"_"+month+"_total"] = (this.fire_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 1;
            } else {
              // if there is a co-producer, then split app count
              this.fire_dots[app["producer_id"]+"_"+month+"_total"] = (this.fire_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 0.5;
              this.fire_dots[app["co_producer_id"]+"_"+month+"_total"] = (this.fire_dots[app["co_producer_id"]+"_"+month+"_total"] || 0) + 0.5;
            }
          }
        }
        //console.log("Fire");
        //console.log(this.fire_dots);

        if (type == "bank") {
          this.bank_totals[month+"_total"] = (this.bank_totals[month+"_total"] || 0) + 1;
          if (this.inCurrentWeek(app_date_obj)) {
            this.bank_totals["week"] = (this.bank_totals["week"] || 0) + 1;
          }

          if (app["co_producer_id"] == "") {
            this.bank_dots[app["producer_id"]+"_"+month+"_total"] = (this.bank_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 1;
          } else {
            // if there is a co-producer, then split app count
            this.bank_dots[app["producer_id"]+"_"+month+"_total"] = (this.bank_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 0.5;
            this.bank_dots[app["co_producer_id"]+"_"+month+"_total"] = (this.bank_dots[app["co_producer_id"]+"_"+month+"_total"] || 0) + 0.5;
            this.bank_dots[app["co_producer_id"]+"_"+month+"_bonus"] = ((this.bank_dots[app["co_producer_id"]+"_"+month+"_bonus"] * 100 || 0) + app["co_producer_bonus"] * 100) / 100;
          }
          if (app["status"] == "Issued") {
            this.bank_totals["year"] += 1;
            this.bank_dots[app["producer_id"]+"_"+month+"_bonus"] = ((this.bank_dots[app["producer_id"]+"_"+month+"_bonus"] * 100 || 0) + app["bonus"] * 100) / 100;
          }
        }
        // console.log("Bank");
        // console.log(this.bank_dots);
        
        if (type == "health") {
          this.health_totals[month+"_total"] = (this.health_totals[month+"_total"] || 0) + 1;
          if (this.inCurrentWeek(app_date_obj)) {
            this.health_totals["week"] = (this.health_totals["week"] || 0) + 1;
          }

          if (app["co_producer_id"] == "") {
            this.health_dots[app["producer_id"]+"_"+month+"_total"] = (this.health_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 1;
          } else {
            // if there is a co-producer, then split app count
            this.health_dots[app["producer_id"]+"_"+month+"_total"] = (this.health_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 0.5;
            this.health_dots[app["co_producer_id"]+"_"+month+"_total"] = (this.health_dots[app["co_producer_id"]+"_"+month+"_total"] || 0) + 0.5;
            this.health_dots[app["co_producer_id"]+"_"+month+"_bonus"] = ((this.health_dots[app["co_producer_id"]+"_"+month+"_bonus"] * 100 || 0) + app["co_producer_bonus"] * 100) / 100;
          }
          if (app["status"] == "Issued") {
            this.health_totals["year"] += 1;
            this.health_dots[app["producer_id"]+"_"+month+"_bonus"] = ((this.health_dots[app["producer_id"]+"_"+month+"_bonus"] * 100 || 0) + app["bonus"] * 100) / 100;
          }
        }
        //console.log("Health");
        //console.log(this.health_dots);

        if (type == "mutual-funds") {
          this.mutual_funds_totals[month+"_total"] = (this.mutual_funds_totals[month+"_total"] || 0) + 1;
          this.mutual_funds_totals[app["producer_id"]+"_"+month+"_total"] = (this.mutual_funds_totals[app["producer_id"]+"_"+month+"_total"] || 0) + 1;
          
          this.mutual_funds_totals[app["producer_id"]+"_"+month+"_total"] += 1;
          this.mutual_funds_totals["premium"] += app["premium"] || 0;
        }

        // app count
        if (type != "life" && "co_producer_id" in app && app["co_producer_id"] != "") {
          // always check that producer is in dictionary (that is they are still hired) before incrementing count

          // for non-life apps w/ co producer the app count is split
          if (Object.keys(this.app_totals_by_producer).includes(app["producer_id"])) { 
            this.app_totals[app["producer_id"]][Number(month)-1] += 0.5;
            this.app_totals_by_producer[app["producer_id"]][Number(month)-1] += 1;
          }

          if (Object.keys(this.app_totals_by_producer).includes(app["co_producer_id"])) {
            this.app_totals[app["co_producer_id"]][Number(month)-1] += 0.5;
            this.app_totals_by_co_producer[app["co_producer_id"]][Number(month)-1] += 1;
          }
        } else {
          // full app count goes to main producer
          if (Object.keys(this.app_totals_by_producer).includes(app["producer_id"])) {
            this.app_totals[app["producer_id"]][Number(month)-1] += 1;
            this.app_totals_by_producer[app["producer_id"]][Number(month)-1] += 1;
          }
        }
      }
    }
  }

  setActive(page: string) {
    this.active_page = page;
  }

  getTotalAppsForProducer(id: string) {
    return this.app_totals[id].reduce((a, b) => a + b, 0);
  }

  getTotalAppsForMonth(month: number) {
    let life = Number(this.life_totals[month+'_total'] ? this.life_totals[month+'_total'] : 0) + (this.life_annuities[month] ? this.life_annuities[month] : 0);
    let auto = Number(this.auto_totals[month+'_total'] ? this.auto_totals[month+'_total'] : 0);
    let fire = Number(this.fire_totals[month+'_total'] ? this.fire_totals[month+'_total'] : 0);
    let bank = Number(this.bank_totals[month+'_total'] ? this.bank_totals[month+'_total'] : 0);
    let health = Number(this.health_totals[month+'_total'] ? this.health_totals[month+'_total'] : 0);
    let mutual = Number(this.mutual_funds_totals[month+'_total'] ? this.mutual_funds_totals[month+'_total'] : 0);
    return Number(life + auto + fire + bank + health + mutual);
  }

  getTotalAppsByProducer(dots, id) {
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      total += dots[id+'_'+i+'_total'] ? dots[id+'_'+i+'_total'] : 0;
    }
    return total;
  }

  getTotalIssuedLifeApps(id: string) {
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      total += this.life_dots[id+'_'+i+'_issued'] ? this.life_dots[id+'_'+i+'_issued'] : 0;
    }
    return total;
  }

  getYearTotal(totals) {
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      total += totals[i+'_total'] ? totals[i+'_total'] : 0;
    }
    return total;
  }

  getYearTotalLifeIssued() {
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      total += this.life_totals[i+'_issued'] ? this.life_totals[i+'_issued'] : 0;
    }
    return total;
  }

  getYearTotalLifePremiumIssued() {
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      total += this.life_premiums[i+'_issued'] ? this.life_premiums[i+'_issued'] : 0;
    }
    return total;
  }

  getTotalRawNewAutoApps(id: string) {
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      total += this.auto_dots[id+'_'+i+'_RN'] ? this.auto_dots[id+'_'+i+'_RN'] : 0
    }
    return total;
  }

  getRawNewAutoYearTotal() {
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      total += this.auto_totals[i+'_RN'] ? this.auto_totals[i+'_RN'] : 0
    }
    return total;
  }

  getAutoOtherYearTotal() {
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      total += this.auto_totals[i+'_other'] ? this.auto_totals[i+'_other'] : 0
    }
    return total;
  }

  loadNotes() {
    this.dataService.notes_ob.pipe(take(1)).subscribe(
      (snapshot: any) => snapshot.map(snap => {
        let displayed = false;
        this.notes.forEach(note => {
          if (snap.payload.key == note.id) {
            displayed = true;
          }
        });
        if (!displayed) {
          let note_object = { 
            id: snap.payload.key,
            text: snap.payload.val()['text'],
            date: snap.payload.val()['date']
          };
          this.notes.push(note_object);
          this.notes.sort((a, b) => a.date - b.date);
        };
      })
    );
  }

  toggleRow(e, producer_id) {
    let mainRow = document.getElementById(producer_id+"_prod");
    let coRow = document.getElementById(producer_id+"_co");
    if (e.innerHTML == '+') {
      e.innerHTML = '-';
      coRow.classList.remove('d-none');
      mainRow.classList.remove('d-none');
    } else {
      e.innerHTML = '+';
      coRow.classList.add('d-none');
      mainRow.classList.add('d-none');
    }
  }

  addNote() {
    // updates notes on screen
    let note_text = this.addNoteForm.get('note').value;

    // check id doesn't exist
    let id = "";
    // console.log(this.notes);
    while (id in this.notes || id == "") {
      id = this.randomString(4);
    }
    
    // updates database w/ new goal/note
    let time = new Date();
    let cur_time = time.getTime();
    let note_object = {};
    note_object[id] = {
      text: note_text,
      date: cur_time
    };
    this.notes.push({
      id: id,
      text: note_text,
      date: cur_time
    });
    this.db.list('notes').update('/', note_object);

    // clears note input
    this.addNoteForm.setValue({'note': ''});
  }

  displayNotePopup(id: string) {
    document.getElementById('modalMessage').innerHTML = "";
    this.selected_note_id = id;
    (document.getElementById('note_to_edit') as HTMLInputElement).value = this.getNoteMessage(id);
  }

  editNote(id: string) {
    document.getElementById("edit_"+id.toString()).classList.remove("hide");
    document.getElementById("display_"+id.toString()).classList.add("hide");
    (document.getElementById("edit_"+id.toString()).getElementsByTagName('INPUT')[0] as HTMLInputElement).value = this.getNoteMessage(id);
  }

  updateNote(id: string) {
    document.getElementById("edit_"+id.toString()).classList.add("hide");
    document.getElementById("display_"+id.toString()).classList.remove("hide");
    for (let note of this.notes) {
      if (note["id"] == id) {
        note["text"] = (document.getElementById("edit_"+id.toString()).getElementsByTagName('INPUT')[0] as HTMLInputElement).value;
        this.db.list('notes').update(id, { "text": note["text"] });
        break;
      }
    }
  }

  deleteNote() {
    let id = this.selected_note_id;
    this.db.list('notes/'+id).remove();
    for (let i = 0; i < this.notes.length; i++) {
      if (id == this.notes[i].id) {
        this.notes.splice(i);
        break;
      }
    }
  }

  displayConfirmDelete(id: string) {
    document.getElementById('modalMessage').innerHTML = "Press confirm to remove note \"" + this.getNoteMessage(id) + "\".";
    this.selected_note_id = id;
  }

  getNoteMessage(id: string) {
    for (let i = 0; i < this.notes.length; i++) {
      if (id == this.notes[i].id) {
        return this.notes[i].text
      }
    }
  }

  downloadReport() {
    this.printing_report = true;
    window.setTimeout(() => {
      document.getElementById("bonuses").classList.add("printPdf");
      document.getElementById("bonuses").classList.remove("noPrintPdf");
      document.getElementById("stats").classList.remove("noPrintPdf");
      document.getElementById("life").classList.remove("noPrintPdf");
      document.getElementById("auto").classList.remove("noPrintPdf");
      document.getElementById("health").classList.remove("noPrintPdf");
      document.getElementById("fire").classList.remove("noPrintPdf");
      document.getElementById("bank").classList.remove("noPrintPdf");
      let rows = document.getElementsByClassName("hiddenRows");
      let hiddenRows = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.classList.contains("d-none")) {
          row.classList.remove("d-none");
          hiddenRows.push(row);
        }
      }
      window.print();
      for (let i = 0; i < hiddenRows.length; i++) {
        const row = hiddenRows[i];
        row.classList.add("d-none");
      }
      this.printing_report = false;
    }, 50);
  }

  // called on month change for production report
  updateSelectedMonth(month: number) { 
    this.selected_month = month;
  }

  togglePrintClass(id: string) {
    if (document.getElementById(id).classList.contains("printPdf")) {
      document.getElementById(id).classList.remove("printPdf");
      document.getElementById(id).classList.add("noPrintPdf");
    } else {
      document.getElementById(id).classList.add("printPdf");
      document.getElementById(id).classList.remove("noPrintPdf");
    }
  }

  filterProductionReportBySelectedMonth() {
    this.togglePrintClass("apps-list-life-" + this.selected_month);
    this.togglePrintClass("apps-list-auto-" + this.selected_month);
    this.togglePrintClass("apps-list-fire-" + this.selected_month);
    this.togglePrintClass("apps-list-health-" + this.selected_month);
    this.togglePrintClass("apps-list-bank-" + this.selected_month);
    this.togglePrintClass("apps-list-mutual-funds-" + this.selected_month);
  }

  downloadProductionReport() {
    this.printing_report = true;
    window.setTimeout(() => {
      document.getElementById("bonuses").classList.remove("printPdf");
      document.getElementById("bonuses").classList.add("noPrintPdf");
      document.getElementById("stats").classList.add("noPrintPdf");
      document.getElementById("life").classList.add("noPrintPdf");
      document.getElementById("auto").classList.add("noPrintPdf");
      document.getElementById("health").classList.add("noPrintPdf");
      document.getElementById("fire").classList.add("noPrintPdf");
      document.getElementById("bank").classList.add("noPrintPdf");
      this.filterProductionReportBySelectedMonth();
      window.print();
      window.setTimeout(() => {
        this.filterProductionReportBySelectedMonth();
      }, 50);
      this.printing_report = false;
    }, 50);
  }

  inCurrentWeek(date) {
    var lastMonday = new Date();
    lastMonday.setDate(lastMonday.getDate() - (lastMonday.getDay()-1)); // Setting date to last monday
    lastMonday.setHours(0,0,0,0);
    const res = lastMonday.getTime() <= date.getTime() && date.getTime() < (lastMonday.getTime() + 604800000); // week length
    return res;
  }

  randomString(length: number) {
    // returns a random alphanumerica string of the inputed length
    let chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
    let randString = "";
    for (let i = 0; i < length; i++) {
      randString += chars[Math.floor(Math.random() * chars.length)];
    }
    return randString;
  }

  getFirstName(str) {
    return str.split(" ", 1); 
  }

  changeTrackerTo(year: number) {
    this.router.navigate(['home', year]).then(() => {
      // Force a full page refresh after navigation, ensures every part of the site is reloaded
      window.location.reload();
    });
  }
}

