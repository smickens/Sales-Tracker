import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Producer, PRODUCERS } from "../producer";
import { AngularFireDatabase } from 'angularfire2/database';
import { FireApp } from '../application';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Location } from "@angular/common"; // Angular service for interacting with the browser

@Component({
  selector: 'app-add-fire',
  templateUrl: './add-fire.component.html',
  styleUrls: ['./add-fire.component.scss']
})
export class AddFireComponent implements OnInit {

  form_title: string = "";
  button_text: string = "";
  app_id: string = ""; // if page is in edit mode, then app_id is set to app's id in database

  producers: Producer[] = PRODUCERS;

  products: string[] = ["Homeowners", "Renters", "PLUP", "PAP", "RDP", "Condo", "Manufac Home", "Boat", "Contractors", "Business", "Workmans Comp", "Bonds", "FLOOD", "CLUP"];
  status_options: string[] = ["Issued", "Declined", "Canceled"];

  private today = new Date();
  addFireAppForm = this.fb.group({ });

  app_loaded = false;

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, private route: ActivatedRoute, private location: Location) {
    db.list('/producers').valueChanges().subscribe(producers => {
      this.producers = producers as Producer[];
    });
    // i think this connection stays open even when leaving page, so look into how you do a once check
  }

  ngOnInit(): void {
    this.app_id = this.route.snapshot.paramMap.get('id');

    if (this.app_id == null) {
      this.form_title = "Add Life App";
      this.button_text = "SUBMIT";
      this.addFireAppForm = this.fb.group({
        date: [this.today],
        producer_name: ['Select Producer'],
        client_name: [],
        product: ['Select Product'],
        submitted_premium: [],
        status: ['Select Status'],
        issued_premium: [],
        marketing_source: []
      });
      this.app_loaded = true;
    } else {
      this.form_title = "Edit Life App";
      this.button_text = "UPDATE";
      this.db.list('applications/' + this.app_id).snapshotChanges().subscribe(
        (snapshot: any) => snapshot.map(snap => {
        this.addFireAppForm.addControl(snap.payload.key, this.fb.control(snap.payload.val()));
        this.app_loaded = true;
      }));
    }
  }

  get(field: string) {
    return this.addFireAppForm.get(field).value;
  }
  
  addApp() {
    let app: FireApp = {
      type: "fire",
      date: this.get("date"),
      client_name: this.get("client_name"),
      producer_name: this.get("producer_name"),
      product: this.get("product"),
      submitted_premium: this.get("submitted_premium"),
      status: this.get("status"),
      issued_premium: this.get("issued_premium"),
      marketing_source: this.get("marketing_source")
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
