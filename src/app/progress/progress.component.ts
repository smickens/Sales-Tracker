import { Component, OnInit } from '@angular/core';
import { Color } from "ng2-charts";
import { AngularFireAuth } from '@angular/fire/auth';
import { DataService } from '../data.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss']
})
export class ProgressComponent implements OnInit {

  app_types = ["life", "auto", "fire", "health", "bank", "mutual-funds"];

  goals = {
    'life': [0, 0, 0],
    'auto': [0, 0, 0],
    'fire': [0, 0, 0],
    'health': [0, 0, 0],
    'bank': [0, 0, 0],
    'mutual-funds': [0, 0, 0]
  };

  totals = {
    'life': [0, 0, 0],
    'auto': [0, 0, 0],
    'fire': [0, 0, 0],
    'health': [0, 0, 0],
    'bank': [0, 0, 0],
    'mutual-funds': [0, 0, 0]
  };

  constructor(public db_auth:  AngularFireAuth, private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        this.loadApplications();
      }
    });
  }

  async loadApplications() {
    await this.dataService.until(_ => this.dataService.apps_loaded == true);
    this.loadGoals();
  }

  loadGoals() {
    for (const app of this.dataService.getAllApps()) {
      const status = app["status"] as string;
      if (status == "Cancelled" || status == "Declined") {
        continue;
      }

      // const month = parseInt(app.date.substring(5, 7));

      let app_type = app.type;

      // TODO: see if more of these should have check for "issued" or "taken"
      if (app_type == "life") {
        if (status == "Taken") {
          this.totals[app_type][2] += 1;
        }
      } else if (app_type == "mutual-funds") {
        if ("contribution_amount" in app) {
          this.totals[app_type][2] += parseInt(app["contribution_amount"]);
        }
      } else {
        this.totals[app_type][2] += 1;
      }
    }

    // console.log("loading goals");
    this.dataService.goals_ob.pipe(take(1)).subscribe(
      (snapshot: any) => snapshot.map(snap => {
        let week_goal = snap.payload.val()["weekly"];
        let month_goal = snap.payload.val()["monthly"];
        let year_goal = snap.payload.val()["yearly"];

        let year_total = this.totals[snap.key][2];

        this.goals[snap.key][0] = week_goal;
        this.goals[snap.key][1] = month_goal;
        this.goals[snap.key][2] = year_goal;

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

  getTitle(str) {
    if (str == "mutual-funds") {
      return "Mutual Funds";
    }
    return str[0].toUpperCase() + str.slice(1);
  }
}
