import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';

import { Producer } from "../producer";
import { AngularFireDatabase } from '@angular/fire/database';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { core } from '@angular/compiler';
import { DataService } from '../data.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.scss']
})
export class MainViewComponent implements OnInit {

  // TODO: need for co-producer on certain app types (auto, fire, bank, and health) to get 0.5 of app count

  // # of apps submitted, # of apps taken
  apps_this_year = {
    "life": [0, 0],
    "auto": [0, 0],
    "bank": [0, 0],
    "fire": [0, 0],
    "health": [0, 0],
    "mutual-funds": [0, 0]
  };

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
  current_year = 0;
  current_month = "";
  monthForm: FormGroup = this.fb.group({ });
  months = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
  selected_month = 1;

  addNoteForm = this.fb.group({
    note: []
  });
  notes = [];
  notes_keys = {};

  selected_note_id = 0

  subscriptions: Subscription[] = [];

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, private dataService: DataService, public db_auth:  AngularFireAuth, private router: Router) { }

  ngOnInit(): void {
    let today = new Date();
    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        this.current_year = today.getFullYear();
        this.selected_month = today.getMonth() + 1;

        // loads producers
        this.dataService.prod_ob.pipe(take(1)).subscribe(
          (snapshot: any) => snapshot.map((snap, index) => {
            let producer: Producer = {
              name: snap.payload.val().name,
              id: snap.key
            }
            this.producers.push(producer);
            this.app_totals_by_producer[producer["id"]] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            this.app_totals_by_co_producer[producer["id"]] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            this.app_totals[producer["id"]] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

            if (snapshot.length == index+1) {
              this.loadDots();
              this.loadGoals();
              this.loadNotes();
            }
        }));
      } else {
        // if user is not logged in, reroute them to the login page
        this.router.navigate(['login']);
      }
    });
    this.current_month = this.months[today.getMonth()];
    this.month_number = today.getMonth() + 1;
    this.monthForm = this.fb.group({
      month: [this.month_number]
    });
  }

  loadDots() {
    // loads in application totals for the year
    this.dataService.apps_ob.pipe(take(1)).subscribe(
      (snapshot: any) => snapshot.map(snap => {
        const app = snap.payload.val();
        const app_date = app["date"] as string;
        const app_year = parseInt(app_date.substring(0, 4));
        let app_month: number = Number(app_date.substr(5, 2)) - 1;
        let app_day: number = Number(app_date.substr(8, 2));
        let app_date_obj = new Date(app_year, app_month, app_day);

        if (app_year == this.current_year) {
          const type = app["type"];
          this.apps_this_year[type][0] += 1;

          // bonus
          const issue_month = snap.payload.val().issue_month;
          const status = snap.payload.val().status as string;
          const month = Number((snap.payload.val().date as string).substring(5, 7));
          if (status == "Issued" || status == "Taken") {
            this.apps_this_year[type][1] += 1;
          }

          if (type == "life") {
            if (app["policy_type"] != "Annuity") {
              this.life_totals[month+"_total"] = (this.life_totals[month+"_total"] || 0) + 1;
              if (this.inCurrentWeek(app_date_obj)) {
                this.life_totals["week"] = (this.life_totals["week"] || 0) + 1;
              }
            }

            this.life_dots[app["producer_id"]+"_"+month+"_total"] = (this.life_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 1;
            if (app["status"] == "Taken") {
              if (app["policy_type"] != "Annuity") {
                this.life_totals["year"] += 1;
                this.life_totals[month+"_issued"] = (this.life_totals[month+"_issued"] || 0) + 1;
              }
              this.life_dots[app["producer_id"]+"_"+month+"_issued"] = (this.life_dots[app["producer_id"]+"_"+month+"_issued"] || 0) + 1;
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
          //console.log("Bank");
          //console.log(this.bank_dots);
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
            // for non-life apps w/ co producer the app count is split
            this.app_totals[app["producer_id"]][Number(month)-1] += 0.5;
            this.app_totals[app["co_producer_id"]][Number(month)-1] += 0.5;

            this.app_totals_by_producer[app["producer_id"]][Number(month)-1] += 1;
            this.app_totals_by_co_producer[app["co_producer_id"]][Number(month)-1] += 1;
          } else {
            // full app count goes to main producer
            this.app_totals_by_producer[app["producer_id"]][Number(month)-1] += 1;
            this.app_totals[app["producer_id"]][Number(month)-1] += 1;
          }
        }
      })
    );
  }

  loadGoals() {
    this.dataService.goals_ob.pipe(take(1)).subscribe(
      (snapshot: any) => snapshot.map(snap => {
        this.goals[snap.key]["yearly"] = snap.payload.val()["yearly"];
        if (snap.key != "mutual-funds") {
          this.goals[snap.key]["weekly"] = snap.payload.val()["weekly"];
          this.goals[snap.key]["monthly"] = snap.payload.val()["monthly"];
        }

        let week_total, month_total, year_total = 0;
        let week_goal = snap.payload.val()["weekly"];
        let month_goal = snap.payload.val()["monthly"];
        let year_goal = snap.payload.val()["yearly"];
        if (snap.key == "life") {
          week_total =  this.life_totals["week"] || 0;
          month_total = this.life_totals[this.month_number+"_total"] || 0;
          year_total = this.life_totals["year"] || 0;
        } else if (snap.key == "auto") {
          week_total =  this.auto_totals["week"] || 0;
          month_total = this.auto_totals[this.month_number+"_total"] || 0;
          year_total = this.auto_totals["year"];
        } else if (snap.key == "fire") {
          week_total =  this.fire_totals["week"] || 0;
          month_total = this.fire_totals[this.month_number+"_total"] || 0;
          year_total = this.fire_totals["year"];
        } else if (snap.key == "bank") {
          week_total =  this.bank_totals["week"] || 0;
          month_total = this.bank_totals[this.month_number+"_issued"] || 0;
          year_total = this.bank_totals["year"];
        } else if (snap.key == "health") {
          week_total =  this.health_totals["week"] || 0;
          month_total = this.health_totals[this.month_number+"_issued"] || 0;
          year_total = this.health_totals["year"];
        } else if (snap.key == "mutual-funds") {
          (document.getElementById("mutual_funds_yearly") as HTMLInputElement).style.width = (this.mutual_funds_totals["premium"] / year_goal) * 100 + '%';
        }

        if (snap.key != "mutual-funds") {
          (document.getElementById(snap.key+"_weekly") as HTMLInputElement).setAttribute("aria-valuenow", week_total);
          // (document.getElementById(snap.key+"_monthly") as HTMLInputElement).setAttribute("aria-valuenow", month_total);
          // (document.getElementById(snap.key+"_yearly") as HTMLInputElement).setAttribute("aria-valuenow", year_total.toString());
          (document.getElementById(snap.key+"_weekly") as HTMLInputElement).setAttribute("aria-valuemax", week_goal);
          // (document.getElementById(snap.key+"_monthly") as HTMLInputElement).setAttribute("aria-valuemax", month_goal);
          // (document.getElementById(snap.key+"_yearly") as HTMLInputElement).setAttribute("aria-valuemax", year_goal);
          (document.getElementById(snap.key+"_weekly") as HTMLInputElement).style.width = (week_total / week_goal) * 100 + '%';
          // (document.getElementById(snap.key+"_monthly") as HTMLInputElement).style.width = (month_total / month_goal) * 100 + '%';
          // (document.getElementById(snap.key+"_yearly") as HTMLInputElement).style.width = (year_total / year_goal) * 100 + '%';
          (document.getElementById(snap.key+"_weekly") as HTMLInputElement).innerHTML = week_total == 0 || null ? '' : week_total;
          // (document.getElementById(snap.key+"_monthly") as HTMLInputElement).innerHTML = month_total == 0 || null ? '' : month_total;
          // (document.getElementById(snap.key+"_yearly") as HTMLInputElement).innerHTML = year_total  == 0 ? '' : year_total.toString();
          (document.getElementById(snap.key+"_monthly") as HTMLInputElement).innerHTML = "Month - " + (month_goal - month_total) + " to go";
          (document.getElementById(snap.key+"_yearly") as HTMLInputElement).innerHTML = "Year - " + (year_goal - year_total) + " to go";
        }
      }
    ));
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

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
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
    let note = this.addNoteForm.get('note').value;

    // check id doesn't exist
    let id = "";
    console.log(this.notes);
    while (id in this.notes || id == "") {
      id = this.randomString(4);
    }
    
    // updates database w/ new goal/note
    let time = new Date();
    let note_object = {};
    note_object[id] = {
      text: note,
      date: time.getTime()
    };
    this.db.list('notes').update('/', note_object);

    // clears note input
    this.addNoteForm.setValue({'note': ''});
  }

  displayNotePopup(id: number) {
    document.getElementById('modalMessage').innerHTML = "";
    this.selected_note_id = id;
    (document.getElementById('note_to_edit') as HTMLInputElement).value = this.getNoteMessage(id);
  }

  updateNote() {

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

  displayConfirmDelete(id: number) {
    document.getElementById('modalMessage').innerHTML = "Press confirm to remove note \"" + this.getNoteMessage(id) + "\".";
    this.selected_note_id = id;
  }

  getNoteMessage(id: number) {
    for (let i = 0; i < this.notes.length; i++) {
      if (id == this.notes[i].id) {
        return this.notes[i].text
      }
    }
  }

  downloadReport() {
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
    this.filterProductionReportBySelectedMonth();
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

}

