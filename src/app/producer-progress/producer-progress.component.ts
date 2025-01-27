import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { DataService } from '../data.service';
import { take } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { Producer } from "../producer";
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-producer-progress',
  templateUrl: './producer-progress.component.html',
  styleUrls: ['./producer-progress.component.scss']
})
export class ProducerProgressComponent implements OnInit {

  months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  selected_month = 1;

  app_types = ["auto_other", "auto_rn", "fire", "life"];

  producers: Producer[] = [];
  producer_goals = {};
  producer_totals = {};

  year: number;

  monthForm: FormGroup = this.fb.group({ });

  constructor(public db_auth:  AngularFireAuth, private fb: FormBuilder, private dataService: DataService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    let today = new Date();

    this.monthForm = this.fb.group({
      month: [today.getMonth() + 1]
    });

    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        this.year = parseInt(this.route.snapshot.paramMap.get('year'));
        this.selected_month = today.getMonth();

        this.loadProducers();
        this.loadApplications();
      }
    });
  }

  async loadProducers() {
    await this.dataService.until(_ => this.dataService.prod_loaded == true);

    for (const producer of this.dataService.producers) {
      if (producer.hired && producer.licensed) {
        this.producer_goals[producer["id"]] = {
          'auto_other': 0,
          'auto_rn': 0,
          'fire': 0,
          'life': 0,
          'total': 0
        };
        this.producer_totals[producer["id"]] = {
          'auto_other': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          'auto_rn': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          'fire': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          'life': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          'total': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };

        this.producers.push(producer);
      }
    }
  }

  async loadApplications() {
    await this.dataService.until(_ => this.dataService.apps_loaded_by_year.has(this.year));
    this.loadGoals();
  }

  async loadGoals() {
    let all_apps_this_year = await this.dataService.getAllApps(this.year);

    // clear goals and totals
    for (const producer of this.producers) {
      // producer goals don't include health
      this.producer_goals[producer["id"]] = {
        'auto_other': 0,
        'auto_rn': 0,
        'fire': 0,
        'life': 0,
        'total': 0
      };
      // but, still want health apps to count towards their monthly totals
      this.producer_totals[producer["id"]] = {
        'auto_other': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        'auto_rn': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        'fire': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        'life': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        'health': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        'total': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      };
    }

    for (const app of all_apps_this_year) {
      const status = app["status"] as string;
      if (status == "Cancelled" || status == "Declined") {
        continue;
      }

      let app_type = app.type;
      const app_month: number = Number(app.date.substring(5, 7)) - 1;
      let producer_id = app["producer_id"];
      var counted = false;

      // in case producer isn't licensed anymore or was given credit but not licensed, then continue
      if (!(producer_id in this.producer_goals)) {
        continue;
      }

      if (app_type == "auto") {
        let is_raw_new = app["auto_type"] == "RN";

        if (is_raw_new) {
          this.producer_totals[producer_id]['auto_rn'][app_month] += 1;
        } else {
          this.producer_totals[producer_id]['auto_other'][app_month] += 1;
        }
        counted = true;
      } else if (app_type == "fire") {
        this.producer_totals[producer_id]['fire'][app_month] += 1;
        counted = true;
      } else if (app_type == "life") {
        this.producer_totals[producer_id]['life'][app_month] += 1;
        counted = true;
      } else if (app_type == "health") {
        this.producer_totals[producer_id]['health'][app_month] += 1;
        counted = true;
      }

      if (counted) {
        this.producer_totals[producer_id]['total'][app_month] += 1;
      }
    }

    // console.log("loading goals");
    this.dataService.producer_goals_ob.pipe(take(1)).subscribe(
      (snapshot: any) => snapshot.map(snap => {
        // in case producer isn't licensed anymore but used to have goals
        if (snap.key in this.producer_goals) {
          let auto_other_goal = snap.payload.val()["auto_other"];
          let auto_rn_goal = snap.payload.val()["auto_rn"];
          let fire_goal = snap.payload.val()["fire"];
          let life_goal = snap.payload.val()["life"];

          this.producer_goals[snap.key]['auto_other'] = auto_other_goal;
          this.producer_goals[snap.key]['auto_rn'] = auto_rn_goal;
          this.producer_goals[snap.key]['fire'] = fire_goal;
          this.producer_goals[snap.key]['life'] = life_goal;

          this.producer_goals[snap.key]['total'] = auto_other_goal + auto_rn_goal + fire_goal + life_goal;
        }
      }
    ));
  }

  updateProducerProgressChart(month: number) {
    this.selected_month = month - 1;
  }

  getFirstName(str) {
    return str.split(" ", 1); 
  }
}
