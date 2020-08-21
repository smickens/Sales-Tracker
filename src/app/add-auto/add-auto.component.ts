import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Producer, PRODUCERS } from "../producer";
import { AngularFireDatabase } from 'angularfire2/database';
import { AutoApp } from '../application';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Location } from "@angular/common"; // Angular service for interacting with the browser

@Component({
  selector: 'app-add-auto',
  templateUrl: './add-auto.component.html',
  styleUrls: ['./add-auto.component.scss']
})
export class AddAutoComponent implements OnInit {

  form_title: string = "";
  button_text: string = "";
  app_id: string = ""; // if page is in edit mode, then app_id is set to app's id in database

  producers: Producer[] = PRODUCERS;
  constants = {};

  // auto_types: string[] = ["R/N", "Added", "State to State", "Prior SF", "Reinstated"];
  // tiers: string[] = ["Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5", "Tier 6"];
  // status_options: string[] = ["Issued", "Declined", "Canceled"];

  private today = new Date();
  addAutoAppForm = this.fb.group({ });

  app_loaded = false;

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, private route: ActivatedRoute, private location: Location) {
    db.list('/producers').valueChanges().subscribe(producers => {
      this.producers = producers as Producer[];
    });

    db.list('constants/auto').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
      this.constants[snap.payload.key] = snap.payload.val();
    }));
    // i think this connection stays open even when leaving page, so look into how you do a once check
  }

  ngOnInit(): void {
    this.app_id = this.route.snapshot.paramMap.get('id');

    if (this.app_id == null) {
      console.log("add form");
      this.form_title = "Add Life App";
      this.button_text = "SUBMIT";
      this.addAutoAppForm = this.fb.group({
        date: [this.today],
        producer_name: ['Select Producer'],
        client_name: [''],
        auto_type: ['Select Auto Type'],
        tiers: ['Select Tier'],
        bonus: [],
        submitted_premium: [],
        status: ['Select Status'],
        issued_premium: [],
        marketing_source: ['Select Marketing Source'],
        co_producer_name: ['Select Co-Producer'],
        co_producer_bonus: ['Select Pivot Bonus']
      });
      this.app_loaded = true;
    } else {
      console.log("edit form");
      this.form_title = "Edit Life App";
      this.button_text = "UPDATE";
      this.db.list('applications/' + this.app_id).snapshotChanges().subscribe(
        (snapshot: any) => snapshot.map(snap => {
        this.addAutoAppForm.addControl(snap.payload.key, this.fb.control(snap.payload.val()));
        this.app_loaded = true;
      }));
    }
  }

  get(field: string) {
    return this.addAutoAppForm.get(field).value;
  }
  
  addApp() {
    let app: AutoApp = {
      type: "auto",
      date: this.get("date"),
      client_name: this.get("client_name"),
      producer_name: this.get("producer_name"),
      auto_type: this.get("auto_type"),
      tiers: this.get("tiers"),
      bonus: this.get("bonus"),
      submitted_premium: this.get("submitted_premium"),
      status: this.get("status"),
      issued_premium: this.get("issued_premium"),
      marketing_source: this.get("marketing_source"),
      co_producer_name: this.get("co_producer_name"),
      co_producer_bonus: this.get("co_producer_bonus")
    }
    console.log(app);

    if (this.app_id == null) {
      // adds new application
      this.db.list('/applications').update(this.randomString(16), app);
    } else {
      // updates existing application
      this.db.list('/applications').update(this.app_id, app);
    }
    // after add should redirect to app page and maybe bring up alert saying successfully added app
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
