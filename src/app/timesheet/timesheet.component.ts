import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AngularFireDatabase } from '@angular/fire/database';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { Producer } from '../producer';
import { DataService } from '../data.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-timesheet',
  templateUrl: './timesheet.component.html',
  styleUrls: ['./timesheet.component.scss']
})
export class TimesheetComponent implements OnInit {

  pastProducers = new Set();
  hiredProducers = new Set();
  saved_timesheets = new Map();
  months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  dates: string[] = [];
  selected_producer_id = "";
  submit_btn_text = "Submit";

  timesheet = {};
  total_hours = 0;
  sick_vacation_hours = 0;
  prior_month_bonuses = {};
  prior_month_bonuses_override = {};
  bonus_breakdown = {};

  popup_message = "";
  popup_title = "";

  monthForm: FormGroup = this.fb.group({ });
  producerForm: FormGroup = this.fb.group({ });
  selected_year: number = 0;

  subscriptions: Subscription[] = [];

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, private dataService: DataService, public  db_auth:  AngularFireAuth, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    let date: Date = new Date(); 
    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        this.loadAllProducers();
        // gets current month and updates sheet to most recent timesheet
        if (date.getDate() <= 14) {
          (document.getElementById("first_half") as HTMLInputElement).checked = true;
          this.updateSheet(date.getMonth() + 1);
        } else {
          (document.getElementById("second_half") as HTMLInputElement).checked = true;
          this.updateSheet(date.getMonth()+1);
          this.getPriorMonthBonus(); // only have prior month bonus on 2nd half of month
        }
      } else {
        // if user is not logged in, reroute them to the login page
        this.router.navigate(['login']);
      }
    });

    // gets current month and updates sheet to last timesheet
    this.selected_year = parseInt(this.route.snapshot.paramMap.get('year'));
    // TODO: delete
    // (document.getElementById("year") as HTMLInputElement).value = this.selected_year.toString();
    let current_month = date.getMonth();
    if (date.getDate() <= 14) {
      // current date is in second half of the month, so selects timesheet #1 from current month
      (document.getElementById("first_half") as HTMLInputElement).checked = true;
    } else {
      // current date is in first half of the month, so selects timesheet #2 from previous month
      (document.getElementById("second_half") as HTMLInputElement).checked = true;
    }
    this.monthForm = this.fb.group({
      month: [current_month + 1]
    });
    this.producerForm = this.fb.group({
      producer: ["all"]
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  async loadAllProducers() {
    await this.dataService.until(_ => this.dataService.prod_loaded == true);
    for (const producer of this.dataService.producers) {
      if (producer.hired) {
        this.hiredProducers.add(producer.id);
      }
      this.prior_month_bonuses[producer.id] = 0;
    }
  }

  async getPriorMonthBonus() {
    let current_month = Number((document.getElementById("month") as HTMLInputElement).value);
    let year = this.selected_year;
    let last_month = current_month - 1;
    if (last_month == 0) {
      last_month = 12;
      year -= 1;
    }

    // console.log("--- loading prior month bonuses for year " + year + " ---");

    this.dataService.loadApplications(year);
    await this.dataService.loadBonuses(year, true);
    for (const producer of this.dataService.producers) {
      let corp_bonus = this.dataService.corporate_bonuses[year][producer.id][last_month-1];
      let prod_bonus = this.dataService.production_bonuses[year][producer.id][last_month-1];
      let apps_written_bonus = this.dataService.apps_written_bonuses[year][producer.id][last_month-1];
      let prior_month_bonus = corp_bonus + prod_bonus + apps_written_bonus;

      if (this.dataService.bonus_breakdown[year] && this.dataService.bonus_breakdown[year][producer.id]) {
        this.bonus_breakdown[producer.id] = this.dataService.bonus_breakdown[year][producer.id][last_month-1];
      }

      // console.log("bonus breakdown for " + producer.id + " is ");
      // console.log(this.bonus_breakdown[producer.id]);

      // console.log("corp bonus for " + producer.id + " is " + prod_bonus);
      // console.log("prod bonus for " + producer.id + " is " + prod_bonus);
  
      this.prior_month_bonuses[producer.id] = (prior_month_bonus * 100) / 100;
      // console.log("prior month bonus for " + producer.id + " is " + this.prior_month_bonuses[producer.id]);
    }
  }

  displayPinAuth(producer_id: string) {
    this.popup_title = "Enter Pin";
    this.popup_message = "";
    this.selected_producer_id = producer_id;
    (document.getElementById("producer_pin") as HTMLInputElement).value = "";
    document.getElementById("auth_section").style.display = 'block';
  }

  checkPin() {
    let pin = Number((document.getElementById("producer_pin") as HTMLInputElement).value);
    for (const producer_id of this.getProducerList()) {
      if (producer_id == this.selected_producer_id) {
        if (this.getProducerPin(String(producer_id)) == pin) {
          // displays timesheet
          this.editTimesheet(this.selected_producer_id, this.getProducerName(this.selected_producer_id));
          document.getElementById("auth_section").style.display = 'none';
          break;
        }
      }
    }
  }

  editTimesheet(producer_id: string, name: string) {
    // console.log("edit timesheet " + producer_id);
    this.selected_producer_id = producer_id;

    let current_month = Number((document.getElementById("month") as HTMLInputElement).value)-1;

    if (this.saved_timesheets.has(producer_id)) {
      // get values from last saved timesheet
      let last_saved_timesheet = this.saved_timesheets.get(producer_id)["dates"];
      var rows = document.getElementById("timesheet_table")["rows"];
      for (let date in last_saved_timesheet) {
        let row = rows[this.dates.indexOf(date)+1];
        let cells = row["cells"];
        //cells[0]["childNodes"][0].value = date;
        if (last_saved_timesheet[date]["holiday"] == true) {
          cells[6]["childNodes"][0].checked = true;
          this.toggleRow(date, 'holiday_rBtn');
        } else if (last_saved_timesheet[date]["off"] == true) {
          cells[7]["childNodes"][0].checked = true;
          this.toggleRow(date, 'off_rBtn');
        } else {
          cells[1]["childNodes"][0].value = last_saved_timesheet[date]["in_1"];
          cells[2]["childNodes"][0].value = last_saved_timesheet[date]["out_1"];
          cells[3]["childNodes"][0].value = last_saved_timesheet[date]["in_2"];
          cells[4]["childNodes"][0].value = last_saved_timesheet[date]["out_2"];
          cells[5]["childNodes"][0].value = last_saved_timesheet[date]["sick_vacation_hours"];
        }
      }
      this.submit_btn_text = "Update";
    } else {
      // bring up default timesheet
      var rows = document.getElementById("timesheet_table")["rows"];
      for (let i = 1; i < rows.length; i++) {
        let row = rows[i];
        let cells = row["cells"];
        cells[1]["childNodes"][0].value = "08:30:00";
        cells[2]["childNodes"][0].value = "12:00:00";
        cells[3]["childNodes"][0].value = "12:30:00"
        cells[4]["childNodes"][0].value = "17:00:00";
        cells[5]["childNodes"][0].value = 0;
        cells[6]["childNodes"][0].checked = false;
        cells[7]["childNodes"][0].checked = false;
        // enables row
        for (let i = 1; i <= 5; i++) {
          let cell = cells[i]
          cell["childNodes"][0].disabled = false;
        }
      }
      this.submit_btn_text = "Submit";
    }
    this.popup_message = name + "\'s Timesheet Submitted!";
    document.getElementById("title").innerHTML = name + "\'s Timesheet - " + this.months[current_month] + " " + this.selected_year;
    document.getElementById("backBtn").style.display = 'block';
    //document.getElementById("hours_left").style.display = 'block';
    document.getElementById("date_section").style.display = 'none';
    document.getElementById("auth_section").style.display = 'none';
    document.getElementById("producer_section").style.display = 'none';
    document.getElementById("timesheet_section").style.display = 'block';
    this.updateTimes();
  }

  exitTimesheet() {
    document.getElementById("title").innerHTML = "Timesheet - ";
    document.getElementById("backBtn").style.display = 'none';
    //document.getElementById("hours_left").style.display = 'none';
    document.getElementById("date_section").style.display = 'flex';
    document.getElementById("producer_section").style.display = 'block';
    document.getElementById("timesheet_section").style.display = 'none';
  }

  // called on month change
  updateSheet(month: number) {
    this.dates = [];
    let date: Date = new Date(); 
    date.setFullYear(this.selected_year);
    date.setMonth(month-1);
    let path = this.months[Number(month)-1];
    path += "_" + this.selected_year;
    if ((document.getElementById("first_half") as HTMLInputElement).checked) {
      for (let i = 1; i <= 14; i++) {
        date.setDate(i);  
        //date.toLocaleDateString()
        if (date.toDateString().substr(0, 3) != "Sun" && date.toDateString().substr(0, 3) != "Sat") {
          this.dates.push(date.toDateString().substring(0, date.toDateString().length-5));
        }
      }
      path += "_1/";
    } else {
      let number_of_days = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate();
      for (let i = 15; i <= number_of_days; i++) {
        date.setDate(i);  
        if (date.toDateString().substr(0, 3) != "Sun" && date.toDateString().substr(0, 3) != "Sat") {
          this.dates.push(date.toDateString().substring(0, date.toDateString().length-5));
        }
      }
      this.getPriorMonthBonus();
      path += "_2/";
    }
    this.total_hours = this.dates.length * 8;
    this.sick_vacation_hours = 0;

    //let filter = (document.getElementById("producer") as HTMLInputElement).value;
    this.saved_timesheets.clear();
    this.pastProducers.clear();
    let timesheet_sub = this.db.list('timesheets/' + path).snapshotChanges().pipe(take(1)).subscribe(
      (snapshot: any) => snapshot.map(snap => {
        const id = snap.payload.val().producer_id as string;

        // check if id is in hired producers list, if not add it to pastProducers
        if (!(id in this.hiredProducers)) {
          this.pastProducers.add(id);
        }

        this.saved_timesheets.set(id, snap.payload.val());
      })
    );
    this.subscriptions.push(timesheet_sub);
  }

  // called on part of month change
  updateDates() {
    this.dates = [];
    let date: Date = new Date(); 
    date.setFullYear(this.selected_year);
    let month = (document.getElementById("month") as HTMLInputElement).value;
    date.setMonth(Number(month)-1);
    let path = this.months[Number(month)-1];
    path += "_" + this.selected_year; // year
    if ((document.getElementById("first_half") as HTMLInputElement).checked) {
      for (let i = 1; i <= 14; i++) {
        date.setDate(i);  
        //date.toLocaleDateString()
        if (date.toDateString().substr(0, 3) != "Sun" && date.toDateString().substr(0, 3) != "Sat") {
          this.dates.push(date.toDateString().substring(0, date.toDateString().length-5));
        }
      }
      path += "_1/";
    } else {
      let number_of_days = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate();
      for (let i = 15; i <= number_of_days; i++) {
        date.setDate(i);  
        if (date.toDateString().substr(0, 3) != "Sun" && date.toDateString().substr(0, 3) != "Sat") {
          this.dates.push(date.toDateString().substring(0, date.toDateString().length-5));
        }
      }
      this.getPriorMonthBonus();
      path += "_2/";
    }
    this.total_hours = this.dates.length * 8;
    this.sick_vacation_hours = 0;

    //let filter = (document.getElementById("producer") as HTMLInputElement).value;
    this.saved_timesheets.clear();
    this.pastProducers.clear();
    let timesheet_sub = this.db.list('timesheets/' + path).snapshotChanges().pipe(take(1)).subscribe(
      (snapshot: any) => snapshot.map(snap => {
        const id = snap.payload.val().producer_id as string;
        
        // check if id is in hired producers list, if not add it to pastProducers
        if (!(id in this.hiredProducers)) {
          this.pastProducers.add(id);
        }

        this.saved_timesheets.set(id, snap.payload.val());
      })
    );
    this.subscriptions.push(timesheet_sub);
  }

  // called when holiday/off is turned on or off
  toggleRow(date: string, btn: string) {
    let row_index = this.dates.indexOf(date);
    var rows = document.getElementById("timesheet_table")["rows"];
    let cells = rows[row_index + 1]["cells"];
    let radio_btn_value = false;
    if (btn == "holiday_rBtn") {
      radio_btn_value = cells[6]["childNodes"][0].checked;
    } else if (btn == "off_rBtn") {
      radio_btn_value = cells[7]["childNodes"][0].checked;
    }
    if (radio_btn_value == true) {
      if (btn == "holiday_rBtn") {
        // if holiday is checked, then it unchecks off
        cells[7]["childNodes"][0].checked = false;
      } else if (btn == "off_rBtn") {
        // if off is checked, then it unchecks holiday
        cells[6]["childNodes"][0].checked = false;
      }
      // disables row
      for (let i = 1; i <= 5; i++) {
        let cell = cells[i]
        cell["childNodes"][0].disabled = true;
      }
    } else {
      // enables row
      for (let i = 1; i <= 5; i++) {
        let cell = cells[i]
        cell["childNodes"][0].disabled = false;
      }
    }
    this.updateTimes();
  }

  // called on in/out time change, holiday/off being checked or unchecked, and edit timesheet
  updateTimes() {
    this.total_hours = 0;
    this.sick_vacation_hours = 0;
    this.timesheet["dates"] = {};
    var rows = document.getElementById("timesheet_table")["rows"];
    for (let i = 1; i < rows.length; i++) {
      let row = rows[i];
      let cells = row["cells"];
      let date = cells[0]["childNodes"][0].data;

      if (cells[1]["childNodes"][0].disabled == false) {
        let in_time_1 = cells[1]["childNodes"][0].value;
        let out_time_1 = cells[2]["childNodes"][0].value;
        let in_time_2 = cells[3]["childNodes"][0].value;
        let out_time_2 = cells[4]["childNodes"][0].value;

        let timeStart = new Date("01/01/2007 " + in_time_1).getTime();
        let timeEnd = new Date("01/01/2007 " + out_time_1).getTime();

        let hourDiff = (timeEnd - timeStart) / 1000;
        hourDiff /= (60 * 60);
        hourDiff = Math.round(hourDiff * 100) / 100;
        this.total_hours += hourDiff;
        //console.log("Time 1 - " + hourDiff); 
        
        timeStart = new Date("01/01/2007 " + in_time_2).getTime();
        timeEnd = new Date("01/01/2007 " + out_time_2).getTime();

        hourDiff = (timeEnd - timeStart) / 1000;
        hourDiff /= (60 * 60);
        hourDiff = Math.round(hourDiff * 100) / 100;
        this.total_hours += hourDiff;
        //console.log("Time 2 - " + hourDiff); 

        this.sick_vacation_hours += Number(cells[5]["childNodes"][0].value);
        //console.log("sick hours - " + cells[5]["childNodes"][0].value);

        this.timesheet["dates"][date] = {
          in_1: in_time_1,
          out_1: out_time_1,
          in_2: in_time_2,
          out_2: out_time_2,
          sick_vacation_hours: Number(cells[5]["childNodes"][0].value)
        };
        this.total_hours = Math.round(this.total_hours * 100) / 100;
      } else {
        if (cells[6]["childNodes"][0].checked) {
          // holiday is checked
          this.timesheet["dates"][date] = { "holiday": true };
          this.total_hours += 8;
        } else if (cells[7]["childNodes"][0].checked) {
          // off is checked
          this.timesheet["dates"][date] = { "off": true };
        }
      }
    }
  }

  // TODO: remove
  // called on selected year change
  updateYear(year: number) {
    this.selected_year = year;
    let date: Date = new Date();
    let month = (document.getElementById("month") as HTMLInputElement).value;
    if (date.getDate() <= 14) {
      this.updateSheet(Number(month));
    } else {
      this.updateSheet(Number(month));
      this.getPriorMonthBonus();
    }
  }

  onSubmit() {
    if (this.selected_producer_id != "none") {
      //let id = this.randomTimesheetID();
      this.timesheet["hours_worked"] = this.total_hours;
      this.timesheet["producer_id"] = this.selected_producer_id;
      this.timesheet["sick_vacation_hours"] = this.sick_vacation_hours;
      let path = this.months[Number((document.getElementById("month") as HTMLInputElement).value)-1]; // month
      path += "_" + this.selected_year; // year
      if ((document.getElementById("first_half") as HTMLInputElement).checked) { // half of month and timesheet id
        path += "_1/" + this.selected_producer_id;
      } else {
        path += "_2/" + this.selected_producer_id;
      }
      this.db.list('timesheets').update(path, this.timesheet);
      // success message
      this.popup_title = "Success";
    } else {
      // error message
      this.popup_title = "Error";
      this.popup_message = "Please select a producer.";
    }
    this.exitTimesheet();
  }

  downloadTimesheets() {
    let filter = (document.getElementById("producer") as HTMLInputElement).value;
    let timesheets_to_print = document.getElementsByClassName("timesheets_to_print");
    for (let i = 0; i < timesheets_to_print.length; i++) {
      const timesheet = timesheets_to_print[i];
      if (filter == "all" || timesheet.id == filter) {
        timesheet.classList.remove("noPrintPdf");
        timesheet.classList.add("printPdf");
      } else {
        timesheet.classList.add("noPrintPdf");
        timesheet.classList.remove("printPdf");
      }
    }

    let month = this.months[Number((document.getElementById("month") as HTMLInputElement).value)-1];
    let timesheet_titles = document.getElementsByClassName("hidden_title");
    for (let i = 0; i < timesheet_titles.length; i++) {
      const title = timesheet_titles[i];
      if (!title.innerHTML.includes("Timesheet")) {
        title.innerHTML += "\'s Timesheet - " + month + " " + this.selected_year;
      }
    }

    if ((document.getElementById("second_half") as HTMLInputElement).checked) {
      this.prior_month_bonuses_override = {};
      for (const id in this.prior_month_bonuses) {
        if (document.getElementById(id+"_prior_month_bonus")) {
          (document.getElementById(id+"_prior_month_bonus") as HTMLInputElement).value = this.prior_month_bonuses[id]
        }
      }
      document.getElementById("download_btn").click();
    } else {
      window.print();
    }
  }

  overridePriorMonthBonus(id: string, bonus: number) {
    this.prior_month_bonuses_override[id] = bonus;
  }

  downloadTimesheetsWithOverride() {
    window.setTimeout(() => {
      window.print();
      this.prior_month_bonuses_override = {};
    }, 400);
  }

  isSecondHalf() {
    if ((document.getElementById("first_half") as HTMLInputElement).checked) {
      return false;
    }
    return true;
  }

  to12HourTime(time) {
    var b = time.split(/\D/);
    return (b[0]%12 || 12) + ':' + b[1] + (b[0]<=11? ' AM' : ' PM');
  }

  getProducerList() {
    var producers = new Set([...this.hiredProducers, ...this.pastProducers]);
    return producers;
  }
  
  getProducerName(id: string) {
    for (const producer of this.dataService.producers) {
      if (producer.id == id) {
        return producer.name;
      }
    }
  }

  getProducerPin(id: string) {
    for (const producer of this.dataService.producers) {
      if (producer.id == id) {
        return producer.pin;
      }
    }
  }

}
