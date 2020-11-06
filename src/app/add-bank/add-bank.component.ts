import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Producer } from "../producer";
import { AngularFireDatabase } from '@angular/fire/database';
import { BankApp } from '../application';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Location } from "@angular/common"; // Angular service for interacting with the browser
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-bank',
  templateUrl: './add-bank.component.html',
  styleUrls: ['./add-bank.component.scss']
})
export class AddBankComponent implements OnInit {

  form_title: string = "";
  button_text: string = "";
  app_id: string = ""; // if page is in edit mode, then app_id is set to app's id in database

  producers: Producer[];
  constants = {};

  // modes: string[] = ["Ann", "Semi", "Q", "Monthly"];
  // status_options: string[] = ["Issued", "Withdrawn", "Declined"];
  // product_types: string[] = ["Financial Cards", "Deposits", "Retirement"];
  // products: string[] = ["Vehicle Loan", "Personal Secured Loan", "HELOC", "Home Equity Loan", "Mortgage Loan", "   ------", "Credit Cards", "Checking/Savings/MM", "   ------", "CD - Standard", "CD - Special", "Coverdell ESA CD", "Roth", "Traditional IRA", "Trust / Estate"];

  private today = new Date();
  addBankAppForm = this.fb.group({ });

  app_loaded = false;

  subscriptions: Subscription[] = [];

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, public  db_auth:  AngularFireAuth, private route: ActivatedRoute, private location: Location, private router: Router) {
    let auth_sub = db_auth.authState.subscribe(user => {
      if (user) {
        environment.logged_in = true;
      } else {
        environment.logged_in = false;
        this.router.navigate(['login']);
      }
    });
    this.subscriptions.push(auth_sub);
    
    let sub1 = db.list('/producers').valueChanges().subscribe(producers => {
      this.producers = producers as Producer[];
    });
    this.subscriptions.push(sub1);

    let sub2 = db.list('constants/bank').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
      this.constants[snap.payload.key] = snap.payload.val().split("_");
    }));
    this.subscriptions.push(sub2);
    // i think this connection stays open even when leaving page, so look into how you do a once check
  }

  ngOnInit(): void {
    this.app_id = this.route.snapshot.paramMap.get('id');

    if (this.app_id == null) {
      this.form_title = "Add Life App";
      this.button_text = "SUBMIT";
      this.addBankAppForm = this.fb.group({
        date: [this.today.toISOString().substr(0, 10)],
        producer_name: ['Select Producer'],
        client_name: [''],
        deposit: [],
        premium: [],
        mode: ['Select Mode'],
        status: ['Select Status'],
        annual_premium: [],
        product_type: ['Select Product Type'],
        product: ['Select Product'],
        bonus: [],
        marketing_source: [],
        co_producer_name: ['Select Co-Producer'],
        co_producer_bonus: ['Select Pivot Bonus']
      });
      this.app_loaded = true;
    } else {
      this.form_title = "Edit Life App";
      this.button_text = "UPDATE";
      this.db.list('applications/' + this.app_id).snapshotChanges().subscribe(
        (snapshot: any) => snapshot.map(snap => {
        this.addBankAppForm.addControl(snap.payload.key, this.fb.control(snap.payload.val()));
        this.app_loaded = true;
      }));
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  get(field: string) {
    return this.addBankAppForm.get(field).value;
  }
  
  addApp() {
    let app: BankApp = {
      type: "bank",
      date: this.get("date"),
      client_name: this.get("client_name"),
      producer_name: this.get("producer_name"),
      deposit: this.get("deposit"),
      premium: this.get("premium"),
      mode: this.get("mode"),
      status: this.get("status"),
      annual_premium: this.get("annual_premium"),
      product_type: this.get("product_type"),
      product: this.get("product"),
      bonus: this.get("bonus"),
      marketing_source: this.get("marketing_source"),
      co_producer_name: this.get("co_producer_name"),
      co_producer_bonus: this.get("co_producer_bonus")
    }
    console.log(app);

    if (this.app_id == null) {
      // adds new application
      this.db.list('/applications').update(this.randomString(16), app).then(() => {
        this.router.navigate(['bank']);
      });
    } else {
      // updates existing application
      this.db.list('/applications').update(this.app_id, app).then(() => {
        this.router.navigate(['bank']);
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
