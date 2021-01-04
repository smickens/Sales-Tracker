import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Producer } from "../producer";
import { AngularFireDatabase } from '@angular/fire/database';
import { LifeApp } from '../application';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Location } from "@angular/common"; // Angular service for interacting with the browser
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-life',
  templateUrl: './add-life.component.html',
  styleUrls: ['./add-life.component.scss']
})
export class AddLifeComponent implements OnInit {

  form_title: string = "";
  button_text: string = "";
  app_id: string = ""; // if page is in edit mode, then app_id is set to app's id in database

  producers: Producer[] = [];
  constants = {};

  private today = new Date();
  addLifeAppForm: FormGroup = this.fb.group({ });

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
    
        let sub2 = db.list('constants/life').snapshotChanges().subscribe(
          (snapshot: any) => snapshot.map(snap => {
          this.constants[snap.payload.key] = snap.payload.val().split("_");
          //console.log(this.constants);
        }));
        this.subscriptions.push(sub2);

        this.app_id = this.route.snapshot.paramMap.get('id');
        //console.log(this.app_id);

        if (this.app_id != null) {
          //console.log("edit form");
          this.form_title = "Edit Life App";
          this.button_text = "UPDATE";
          let app_sub = this.db.list('applications/' + this.app_id).snapshotChanges().subscribe(
            (snapshot: any) => snapshot.map(snap => {
            this.addLifeAppForm.addControl(snap.payload.key, this.fb.control(snap.payload.val()));
            this.app_loaded = true;
          }));
          this.subscriptions.push(app_sub);
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
      //console.log("add form");
      this.form_title = "Add Life App";
      this.button_text = "SUBMIT";
      this.addLifeAppForm = this.fb.group({
        date: [this.today.toISOString().substr(0, 10)],
        producer_id: [''], // * CHECK that only main producer get life app count
        client_name: [''],
        premium: [0],
        mode: ['Monthly'],
        annual_premium: [0], 
        policy_type: ['Term'],
        product: ['20 Yr Term'],
        client_type: ['New'],
        bonus: [0], // * CHECK can this just be removed, since it equals annual premium
        status: [''],
        paid_bonus: [0],
        life_pivot_bonus: [''],
        issue_month: [this.today.getMonth()],
        marketing_source: ['Current Client'],
        co_producer_id: [''],
        co_producer_bonus: [0]
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
    }
    this.addLifeAppForm.get('bonus').setValue(factor * this.get('premium'));
    this.addLifeAppForm.get('annual_premium').setValue(factor * this.get('premium'));
    this.updateBonus();
  }

  updateBonus() {
    if (this.get("life_pivot_bonus") == "Manual") {
      // in manual mode paid bonus and co producer bonus are allowed to be manually edited
      document.getElementById('paid_bonus').removeAttribute('readonly');
      document.getElementById('co_producer_bonus').removeAttribute('readonly');
    } else {
      // if a life pivot percentage is set, then paid and co producer bonus are read only values determined by percentage
      document.getElementById('paid_bonus').setAttribute('readonly', 'true');
      document.getElementById('co_producer_bonus').setAttribute('readonly', 'true');

      let percentage = Number(this.get("life_pivot_bonus").substring(0, this.get("life_pivot_bonus").length-1)) / 100;
      //console.log("Percentage: " + percentage);

      // min bonus is always 25
      if (percentage * this.get('annual_premium') >= 25) {
        let main_producer_bonus = percentage * this.get('annual_premium');
        main_producer_bonus = Math.round(main_producer_bonus * 100) / 100;
        this.addLifeAppForm.get('paid_bonus').setValue(main_producer_bonus);
      } else {
        this.addLifeAppForm.get('paid_bonus').setValue(25);
      }
      if (this.get('co_producer_id') != "") {
        if ((1-percentage) * this.get('annual_premium') >= 25) {
          let co_producer_bonus = (1-percentage) * this.get('annual_premium');
          co_producer_bonus = Math.round(co_producer_bonus * 100) / 100;
          this.addLifeAppForm.get('co_producer_bonus').setValue(co_producer_bonus);
        } else {
          this.addLifeAppForm.get('co_producer_bonus').setValue(25);
        }
      } else {
        this.addLifeAppForm.get('co_producer_bonus').setValue(0);
      }
    }
  }

  get(field: string) {
    return this.addLifeAppForm.get(field).value;
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
    if (!this.checkIfValid("mode", this.get("mode"))) {
      isValid = false;
    }
    if (!this.checkIfValid("policy_type", this.get("policy_type"))) {
      isValid = false;
    } 
    if (!this.checkIfValid("product", this.get("product"))) {
      isValid = false;
    } 
    if (!this.checkIfValid("client_type", this.get("client_type"))) {
      isValid = false;
    } 
    if (!this.checkIfValid("life_pivot_bonus", this.get("life_pivot_bonus"))) {
      isValid = false;
    }
    if (!this.checkIfValid("status", this.get("status"))) {
      isValid = false;
    }

    // if form is invalid, it breaks out of function and displays a popup with the missing values
    if (!isValid) {
      return;
    }
    
    let app: LifeApp = {
      type: "life",
      date: this.get("date"),
      client_name: this.get("client_name"),
      producer_id: this.get("producer_id"),
      premium: this.get("premium"),
      mode: this.get("mode"),
      annual_premium: this.get("annual_premium"),
      policy_type: this.get("policy_type"),
      product: this.get("product"),
      client_type: this.get("client_type"),
      bonus: this.get("bonus"),
      status: this.get("status"),
      paid_bonus: this.get("paid_bonus"),
      life_pivot_bonus: this.get("life_pivot_bonus"),
      issue_month: this.get("issue_month"),
      marketing_source: this.get("marketing_source"),
      co_producer_id: this.get("co_producer_id"),
      co_producer_bonus: this.get("co_producer_bonus")
    }
    console.log(app);

    if (this.app_id == null) {
      // adds new application
      this.db.list('/applications').update(this.randomString(16), app).then(() => {
        this.router.navigate(['life']);
      });
    } else {
      // updates existing application
      this.db.list('/applications').update(this.app_id, app).then(() => {
        this.router.navigate(['life']);
      });
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
