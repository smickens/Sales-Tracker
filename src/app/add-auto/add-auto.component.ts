import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Producer } from "../producer";
import { AngularFireDatabase } from '@angular/fire/database';
import { AutoApp } from '../application';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Location } from "@angular/common"; // Angular service for interacting with the browser
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-auto',
  templateUrl: './add-auto.component.html',
  styleUrls: ['./add-auto.component.scss']
})
export class AddAutoComponent implements OnInit {

  form_title: string = "";
  button_text: string = "";
  app_id: string = ""; // if page is in edit mode, then app_id is set to app's id in database

  producers: Producer[] = [];
  constants = {};

  // auto_types: string[] = ["R/N", "Added", "State to State", "Prior SF", "Reinstated"];
  // tiers: string[] = ["Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5", "Tier 6"];
  // status_options: string[] = ["Issued", "Declined", "Canceled"];

  private today = new Date();
  addAutoAppForm = this.fb.group({ });

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
    
        let sub2 = db.list('constants/auto').snapshotChanges().subscribe(
          (snapshot: any) => snapshot.map(snap => {
          this.constants[snap.payload.key] = snap.payload.val().split("_");
        }));
        this.subscriptions.push(sub2);

        if (this.app_id != null) {
          //console.log("edit form");
          this.form_title = "Edit Auto App";
          this.button_text = "UPDATE";
          this.db.list('applications/' + this.app_id).snapshotChanges().subscribe(
            (snapshot: any) => snapshot.map(snap => {
            this.addAutoAppForm.addControl(snap.payload.key, this.fb.control(snap.payload.val()));
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
    //console.log(this.today.toISOString().substr(0, 10));

    if (this.app_id == null) {
      //console.log("add form");
      this.form_title = "Add Auto App";
      this.button_text = "SUBMIT";
      this.addAutoAppForm = this.fb.group({
        date: [this.today.toISOString().substr(0, 10)],
        producer_id: ['Select Producer'],
        client_name: [''],
        auto_type: ['RN'],
        tiers: ['Tier 1'],
        bonus: [0],
        submitted_premium: [0],
        status: ['Submitted'],
        issued_premium: [0], 
        marketing_source: [''],
        co_producer_id: ['Select Co-Producer'],
        co_producer_bonus: [0]
      });
      this.app_loaded = true;
    } 
    // else {
    //   this.form_title = "Edit Auto App";
    //   console.log("edit form");
    //   this.button_text = "UPDATE";
    //   this.db.list('applications/' + this.app_id).snapshotChanges().subscribe(
    //     (snapshot: any) => snapshot.map(snap => {
    //     this.addAutoAppForm.addControl(snap.payload.key, this.fb.control(snap.payload.val()));
    //     this.app_loaded = true;
    //   }));
    // }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  get(field: string) {
    return this.addAutoAppForm.get(field).value;
  }
  
  // TODO: add in validation checks
  // * #1 - tiers is only used if auto type is RN
  addApp() {
    console.log(this.addAutoAppForm.valid);
    let app: AutoApp = {
      type: "auto",
      date: this.get("date"),
      client_name: this.get("client_name"),
      producer_id: this.get("producer_id"),
      auto_type: this.get("auto_type"),
      tiers: this.get("tiers"),
      bonus: this.get("bonus"),
      submitted_premium: this.get("submitted_premium"),
      status: this.get("status"),
      issued_premium: this.get("issued_premium"),
      marketing_source: this.get("marketing_source"),
      co_producer_id: this.get("co_producer_id"),
      co_producer_bonus: this.get("co_producer_bonus")
    }
    if (app.producer_id.includes("Select")) {
      // validation error, no producer is selected
    }
    if (app.client_name.includes("Select")) {
      // validation error, no client name inputed
    }
    if (app.co_producer_id.includes("Select")) {
      app.co_producer_id = "";
    }
    console.log(app);

    // if (this.app_id == null) {
    //   // adds new application
    //   this.db.list('/applications').update(this.randomString(16), app).then(() => {
    //     this.router.navigate(['auto']);
    //   });
    // } else {
    //   // updates existing application
    //   this.db.list('/applications').update(this.app_id, app).then(() => {
    //     this.router.navigate(['auto']);
    //   });
    // }
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
