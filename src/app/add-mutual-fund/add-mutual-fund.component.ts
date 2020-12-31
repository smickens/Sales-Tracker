import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Producer } from "../producer";
import { AngularFireDatabase } from '@angular/fire/database';
import { BankApp, MutualFundApp } from '../application';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Location } from "@angular/common"; // Angular service for interacting with the browser
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-mutual-fund',
  templateUrl: './add-mutual-fund.component.html',
  styleUrls: ['./add-mutual-fund.component.scss']
})
export class AddMutualFundComponent implements OnInit {
  
  form_title: string = "";
  button_text: string = "";
  app_id: string = ""; // if page is in edit mode, then app_id is set to app's id in database

  producers: Producer[] = [];
  constants = {};

  private today = new Date();
  addMutualFundsForm: FormGroup = this.fb.group({ });

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
    
        let sub2 = db.list('constants/mutual-funds').snapshotChanges().subscribe(
          (snapshot: any) => snapshot.map(snap => {
          this.constants[snap.payload.key] = snap.payload.val().split("_");
        }));
        this.subscriptions.push(sub2);

        this.app_id = this.route.snapshot.paramMap.get('id');
        //console.log(this.app_id);
        if (this.app_id != null) {
          this.form_title = "Edit Mutual Funds App";
          this.button_text = "UPDATE";
          this.db.list('applications/' + this.app_id).snapshotChanges().subscribe(
            (snapshot: any) => snapshot.map(snap => {
            this.addMutualFundsForm.addControl(snap.payload.key, this.fb.control(snap.payload.val()));
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
      this.form_title = "Add Mutual Funds App";
      this.button_text = "SUBMIT";
      this.addMutualFundsForm = this.fb.group({
        date: [this.today.toISOString().substr(0, 10)],
        producer_id: [''],
        client_name: [''],
        product_type: ['Traditional IRA'],
        amount: ['1-Time Contribution'],
        marketing_source: ['Current Client']
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
    return this.addMutualFundsForm.get(field).value;
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
    if (!this.checkIfValid("amount", this.get("amount"))) {
      isValid = false;
    }

    // if form is invalid, it breaks out of function and displays a popup with the missing values
    if (!isValid) {
      return;
    }
    
    // only allows agent to add mutual fund
    if (this.get("producer_id") == "napD") {
      let app: MutualFundApp = {
        type: "mutual-funds",
        date: this.get("date"),
        client_name: this.get("client_name"),
        producer_id: this.get("producer_id"),
        product_type: this.get("product_type"),
        amount: this.get("amount"),
        marketing_source: this.get("marketing_source")
      }
      // console.log(app);
  
      if (this.app_id == null) {
        // adds new application
        this.db.list('/applications').update(this.randomString(16), app).then(() => {
          this.router.navigate(['mutual-funds']);
        });
      } else {
        // updates existing application
        this.db.list('/applications').update(this.app_id, app).then(() => {
          this.router.navigate(['mutual-funds']);
        });
      }
    } else {
      document.getElementById("producer_id").classList.add("is-invalid");
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
