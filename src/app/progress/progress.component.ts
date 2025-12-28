import { Component, OnInit } from '@angular/core';
import { Color } from "ng2-charts";
import { AngularFireAuth } from '@angular/fire/auth';
import { DataService } from '../data.service';
import { take } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss']
})
export class ProgressComponent implements OnInit {

  app_types = ["life", "auto", "auto-rn", "fire", "health", "bank", "mutual-funds"];

  // week, month, quarter, year
  goals = {
    'life': { 'week': 0, 'month': 0, 'year': 0 },
    'auto': { 'week': 0, 'month': 0, 'year': 0 },
    'auto-rn': { 'week': 0, 'month': 0, 'year': 0 },
    'fire': { 'week': 0, 'month': 0, 'year': 0 },
    'health': { 'week': 0, 'month': 0, 'year': 0 },
    'bank': { 'week': 0, 'month': 0, 'year': 0 },
    'mutual-funds': { 'week': 0, 'month': 0, 'year': 0 }
  };
  totals = {
    'life': { 'week': 0, 'month': 0, 'year': 0 },
    'auto': { 'week': 0, 'month': 0, 'year': 0 },
    'auto-rn': { 'week': 0, 'month': 0, 'year': 0 },
    'fire': { 'week': 0, 'month': 0, 'year': 0 },
    'health': { 'week': 0, 'month': 0, 'year': 0 },
    'bank': { 'week': 0, 'month': 0, 'year': 0 },
    'mutual-funds': { 'week': 0, 'month': 0, 'year': 0 }
  };

  timeframe = 'month';

  auto_rn_quarter_1 = 0;
  life_quarter_1 = 0;

  year: number;

  constructor(public db_auth:  AngularFireAuth, private dataService: DataService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        this.year = parseInt(this.route.snapshot.paramMap.get('year'));
        this.loadApplications();
      }
    });
  }

  async loadApplications() {
    await this.dataService.until(_ => this.dataService.apps_loaded_by_year.has(this.year));
    this.loadGoals();
  }

  async loadGoals() {
    let all_apps_this_year = await this.dataService.getAllApps(this.year);

    // clear goals and totals
    for (const app_type of this.app_types) {
      this.goals[app_type] = {
        'week': 0,
        'month': 0,
        'year': 0
      };

      this.totals[app_type] = {
        'week': 0,
        'month': 0,
        'year': 0
      };
    }

    for (const app of all_apps_this_year) {
      const status = app["status"] as string;
      if (status == "Cancelled" || status == "Declined") {
        continue;
      }

      let app_type = app.type;

      const app_year = parseInt(app.date.substring(0, 4));
      const app_month: number = Number(app.date.substring(5, 7)) - 1;
      const app_day: number = Number(app.date.substring(8, 10));
      let app_date_obj = new Date(app_year, app_month, app_day);
      let in_week = this.inWeek(app_date_obj);

      let today = new Date();
      let in_month = this.inMonth(app.date, today.getMonth());

      // TODO: see if more of these should have check for "issued" or "taken"
      if (app_type == "mutual-funds") {
        if ("contribution_amount" in app) {
          this.totals[app_type]['week'] += in_week ? parseInt(app["contribution_amount"]) : 0;
          this.totals[app_type]['month'] += in_month ? parseInt(app["contribution_amount"]) : 0;
          this.totals[app_type]['year'] += parseInt(app["contribution_amount"]);
        }
      } else {
        this.totals[app_type]['week'] += in_week ? 1 : 0;
        this.totals[app_type]['month'] += in_month ? 1 : 0;
        this.totals[app_type]['year'] += 1;
      }

      let is_raw_new = app_type == "auto" && app["auto_type"] == "RN";
      let in_first_quarter = this.inFirstQuarter(app.date);
      let is_issued = app["status"] == "Issued";
      if (is_raw_new && in_first_quarter && is_issued) {
        this.auto_rn_quarter_1 += 1;
      }

      if (is_raw_new) {
        this.totals["auto-rn"]['week'] += in_week ? 1 : 0;
        this.totals["auto-rn"]['month'] += in_month ? 1 : 0;
        this.totals["auto-rn"]['year'] += 1;
      }

      if (app_type == "life" && app["status"] == "Taken") {
        this.life_quarter_1 += 1;
      }
    }

    // console.log("loading goals");
    this.dataService.goals_ob.pipe(take(1)).subscribe(
      (snapshot: any) => snapshot.map(snap => {
        let week_goal = snap.payload.val()["weekly"];
        let month_goal = snap.payload.val()["monthly"];
        let year_goal = snap.payload.val()["yearly"];

        // let year_total = this.totals[snap.key]['year'];

        this.goals[snap.key]['week'] = week_goal;
        this.goals[snap.key]['month'] = month_goal;
        this.goals[snap.key]['year'] = year_goal;

        // if (snap.key != "mutual-funds") {
          // TODO: ERROR TypeError: Cannot read properties of null (reading 'setAttribute')
          // (document.getElementById(snap.key+"_weekly") as HTMLInputElement).setAttribute("aria-valuenow", week_total);
          // (document.getElementById(snap.key+"_monthly") as HTMLInputElement).setAttribute("aria-valuenow", this.totals[app.type][1]);
          // (document.getElementById(snap.key+"_weekly") as HTMLInputElement).setAttribute("aria-valuemax", week_goal);
          // (document.getElementById(snap.key+"_monthly") as HTMLInputElement).setAttribute("aria-valuemax", month_goal);
          // (document.getElementById(snap.key+"_weekly") as HTMLInputElement).style.width = (week_total / week_goal) * 100 + '%';
          // (document.getElementById(snap.key+"_monthly") as HTMLInputElement).style.width = (month_total / month_goal) * 100 + '%';
          // (document.getElementById(snap.key+"_weekly") as HTMLInputElement).innerHTML = week_total == 0 || null ? '' : week_total;
          // (document.getElementById(snap.key+"_monthly") as HTMLInputElement).innerHTML = month_total == 0 || null ? '' : month_total;
          // (document.getElementById(snap.key+"_yearly") as HTMLInputElement).innerHTML = year_total  == 0 ? '' : year_total.toString();
          // (document.getElementById(snap.key+"_monthly") as HTMLInputElement).innerHTML = "Month - " + (month_goal - month_total) + " to go";
          // (document.getElementById(snap.key+"_yearly") as HTMLInputElement).innerHTML = "Year - " + (year_goal - year_total) + " to go";

          // (document.getElementById(snap.key+"_yearly") as HTMLInputElement).setAttribute("aria-valuenow", year_total);
          // (document.getElementById(snap.key+"_yearly") as HTMLInputElement).setAttribute("aria-valuemax", year_goal);
          // (document.getElementById(snap.key+"_yearly") as HTMLInputElement).style.width = (year_total / year_goal) * 100 + '%';
          // (document.getElementById(snap.key+"_progress") as HTMLInputElement).innerHTML = this.getTitle(snap.key) + ": " + year_total + " / " + year_goal;

          // console.log("setting max for " + snap.key + " to " + year_goal + " and value to " + this.totals[snap.key][2]);
        // }
      }
    ));
  }

  private inWeek(date) {
    const todayObj = new Date();
    const todayDate = todayObj.getDate();
    const todayDay = todayObj.getDay();
  
    // get first date of week
    const firstDayOfWeek = new Date(todayObj.setDate(todayDate - todayDay));
  
    // get last date of week
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
  
    // if date is equal or within the first and last dates of the week
    return date >= firstDayOfWeek && date <= lastDayOfWeek;
  }

  private inMonth(value: string, month: number) {
    return parseInt(value.substring(5, 7)) == month+1;
  }

  private inFirstQuarter(value: string) {
    return parseInt(value.substring(5, 7)) in [1, 2, 3];
  }

  updateProgressChart(timeframe: string) {
    this.timeframe = timeframe;
  }

  getTitle(str) {
    if (str == "mutual-funds") {
      return "Mutual Funds";
    }
    if (str == "auto-rn") {
      return "Auto (RN)";
    }
    return str[0].toUpperCase() + str.slice(1);
  }
}
