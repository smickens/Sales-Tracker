import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

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

  producers: Producer[] = [];
  constants = {};

  private today = new Date();
  addBankAppForm: FormGroup = this.fb.group({ });

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
    
        let sub2 = db.list('constants/bank').snapshotChanges().subscribe(
          (snapshot: any) => snapshot.map(snap => {
          this.constants[snap.payload.key] = snap.payload.val().split("_");
        }));
        this.subscriptions.push(sub2);

        this.app_id = this.route.snapshot.paramMap.get('id');
        //console.log(this.app_id);
        if (this.app_id != null) {
          this.form_title = "Edit Bank App";
          this.button_text = "UPDATE";
          this.db.list('applications/' + this.app_id).snapshotChanges().subscribe(
            (snapshot: any) => snapshot.map(snap => {
            this.addBankAppForm.addControl(snap.payload.key, this.fb.control(snap.payload.val()));
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
    //console.log(this.app_id);

    if (this.app_id == null) {
      this.form_title = "Add Bank App";
      this.button_text = "SUBMIT";
      this.addBankAppForm = this.fb.group({
        date: [this.today.toISOString().substr(0, 10)],
        producer_id: [''],
        client_name: [''],
        status: [''], 
        product_type: ['Quicken Mortage Refi'],
        bonus: [0], // keep manual
        marketing_source: ['Current Client'],
        co_producer_id: [''],
        co_producer_bonus: [0] // keep manual
      });
      this.app_loaded = true;
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

  setValid(e) {
    e.target.classList.remove("is-invalid");
  }

  checkIfValid(id: string, value: string) {
    if (value == "") {
      document.getElementById(id).classList.add("is-invalid");
      return false;
    }
    document.getElementById(id).classList.remove("is-invalid");
    return true;
  }
  
  onSubmit() {
    let isValid = true;
    if (!this.checkIfValid("client_name", (this.get("client_name") as string).trim())) {
      isValid = false;
    }
    if (!this.checkIfValid("producer_id", this.get("producer_id"))) {
      isValid = false;
    }
    if (!this.checkIfValid("product_type", this.get("product_type"))) {
      isValid = false;
    }
    if (!this.checkIfValid("status", this.get("status"))) {
      isValid = false;
    }

    // if form is invalid, it breaks out of function and displays a popup with the missing values
    if (!isValid) {
      return;
    }

    let app: BankApp = {
      type: "bank",
      date: this.get("date"),
      client_name: this.get("client_name"),
      producer_id: this.get("producer_id"),
      status: this.get("status"),
      product_type: this.get("product_type"),
      bonus: this.get("bonus"),
      marketing_source: this.get("marketing_source"),
      co_producer_id: this.get("co_producer_id"),
      co_producer_bonus: this.get("co_producer_bonus")
    }
    // console.log(app);

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
