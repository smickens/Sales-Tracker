import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Producer, PRODUCERS } from "../producer";
import { AngularFireDatabase } from 'angularfire2/database';
import { LifeApp } from '../application';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Location } from "@angular/common"; // Angular service for interacting with the browser

@Component({
  selector: 'app-add-life',
  templateUrl: './add-life.component.html',
  styleUrls: ['./add-life.component.scss']
})
export class AddLifeComponent implements OnInit {

  form_title: string = "";
  button_text: string = "";
  app_id: string = ""; // if page is in edit mode, then app_id is set to app's id in database

  producers: Producer[] = PRODUCERS;
  constants = {};

  // modes: string[] = ["Annual", "Monthly"];
  // policy_types: string[] = ["Permanent", "Term"];
  // products: string[] = ["WL", "UL", "..."];
  // client_types: string[] = ["New", "Add", "COP", "CONV", "JUV"];
  // status_options: string[] = ["U/W", "Taken", "Not Taken", "Rejected", "Withdrawn", "Pending"];
  // life_pivot_bonuses: string[] = ["Full", "80%", "20%", "..."];

  private today = new Date();
  addLifeAppForm: FormGroup = this.fb.group({ });

  app_loaded = false;

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, private route: ActivatedRoute, private location: Location) {
    db.list('producers').valueChanges().subscribe(producers => {
      this.producers = producers as Producer[];
    });

    db.list('constants/life').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
      this.constants[snap.payload.key] = snap.payload.val();
      console.log(this.constants);
    }));
    // i think this connection stays open even when leaving page, so look into how you do a once check

    // might unsubscribe in ngOnDestroy
  }

  ngOnInit(): void {
    this.app_id = this.route.snapshot.paramMap.get('id');
    console.log(this.app_id);

    if (this.app_id == null) {
      console.log("add form");
      this.form_title = "Add Life App";
      this.button_text = "SUBMIT";
      this.addLifeAppForm = this.fb.group({
        date: [this.today],
        producer_name: ['Select Producer'],
        client_name: [''],
        premium: [],
        mode: ['Select Mode'],
        annual_premium: [],
        policy_type: ['Select Policy Type'],
        product: ['Select Product'],
        client_type: ['Select Client Type'],
        bonus: [],
        bound: [false],
        status: ['Select Status'],
        paid_bonus: [],
        issue_month: ['Select Issue Month'],
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
        this.addLifeAppForm.addControl(snap.payload.key, this.fb.control(snap.payload.val()));
        this.app_loaded = true;
      }));
    }
  }

  get(field: string) {
    return this.addLifeAppForm.get(field).value;
  }
  
  onSubmit() {
    let app: LifeApp = {
      type: "life",
      date: this.get("date"),
      client_name: this.get("client_name"),
      producer_name: this.get("producer_name"),
      premium: this.get("premium"),
      mode: this.get("mode"),
      annual_premium: this.get("annual_premium"),
      policy_type: this.get("policy_type"),
      product: this.get("product"),
      client_type: this.get("client_type"),
      bonus: this.get("bonus"),
      bound: this.get("bound"),
      status: this.get("status"),
      paid_bonus: this.get("paid_bonus"),
      issue_month: this.get("issue_month"),
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
