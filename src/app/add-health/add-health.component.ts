import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Producer } from "../producer";
import { AngularFireDatabase } from '@angular/fire/database';
import { HealthApp } from '../application';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Location } from "@angular/common"; // Angular service for interacting with the browser
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-health',
  templateUrl: './add-health.component.html',
  styleUrls: ['./add-health.component.scss']
})
export class AddHealthComponent implements OnInit {

  form_title: string = "";
  button_text: string = "";
  app_id: string = ""; // if page is in edit mode, then app_id is set to app's id in database

  producers: Producer[] = [];
  constants = {};

  private today = new Date();
  addHealthAppForm = this.fb.group({ });

  app_loaded = false;

  subscriptions: Subscription[] = [];

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, public  db_auth:  AngularFireAuth, private route: ActivatedRoute, private location: Location, private router: Router) {
    let auth_sub = db_auth.authState.subscribe(user => {
      if (user) {
        environment.logged_in = true;

        // loads producers
        let producer_sub = db.list('producers').snapshotChanges().subscribe(
          (snapshot: any) => snapshot.map(snap => {
            let producer: Producer = {
              name: snap.payload.val().name,
              id: snap.key
            }
            this.producers.push(producer);
        }));
        this.subscriptions.push(producer_sub);
    
        let sub2 = db.list('constants/health').snapshotChanges().subscribe(
          (snapshot: any) => snapshot.map(snap => {
          this.constants[snap.payload.key] = snap.payload.val().split("_");
        }));
        this.subscriptions.push(sub2);

        if (this.app_id != null) {
          this.form_title = "Edit Health App";
          this.button_text = "UPDATE";
          this.db.list('applications/' + this.app_id).snapshotChanges().subscribe(
            (snapshot: any) => snapshot.map(snap => {
            this.addHealthAppForm.addControl(snap.payload.key, this.fb.control(snap.payload.val()));
            this.app_loaded = true;
          }));
        }

      } else {
        environment.logged_in = false;
        this.router.navigate(['login']);
      }
    });
    this.subscriptions.push(auth_sub);
  }

  ngOnInit(): void {
    this.app_id = this.route.snapshot.paramMap.get('id');

    if (this.app_id == null) {
      this.form_title = "Add Health App";
      this.button_text = "SUBMIT";
      this.addHealthAppForm = this.fb.group({
        date: [this.today.toISOString().substr(0, 10)],
        producer_id: ['Select Producer'],
        client_name: [''],
        premium: [],
        mode: ['Monthly'],
        status: ['Select Status'],
        annual_premium: [],
        product: ['Disability Income'],
        bonus: [], // keep manual
        marketing_source: ['Current Client'],
        co_producer_id: ['Select Co-Producer'],
        co_producer_bonus: [] // keep manual
      });
      this.app_loaded = true;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  updateAnnualPremium() {
    let factor = 1; // defaults to annual
    let mode = this.get("mode");
    if (mode == "Monthly") {
      factor = 12;
    } else if (mode == "Quarterly") {
      factor = 4;
    } else if (mode == "Semi-Annual") {
      factor = 2;
    }
    this.addHealthAppForm.get('annual_premium').setValue(factor * this.get('premium'));
  }

  get(field: string) {
    return this.addHealthAppForm.get(field).value;
  }
  
  addApp() {
    let app: HealthApp = {
      type: "health",
      date: this.get("date"),
      client_name: this.get("client_name"),
      producer_id: this.get("producer_id"),
      premium: this.get("premium"),
      mode: this.get("mode"),
      status: this.get("status"),
      annual_premium: this.get("annual_premium"),
      product: this.get("product"),
      bonus: this.get("bonus"),
      marketing_source: this.get("marketing_source"),
      co_producer_id: this.get("co_producer_id"),
      co_producer_bonus: this.get("co_producer_bonus")
    }
    console.log(app);

    if (this.app_id == null) {
      // adds new application
      this.db.list('/applications').update(this.randomString(16), app).then(() => {
        this.router.navigate(['health']);
      });
    } else {
      // updates existing application
      this.db.list('/applications').update(this.app_id, app).then(() => {
        this.router.navigate(['health']);
      });
    }

    // after add should bring up alert saying successfully added app
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