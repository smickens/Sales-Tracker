import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Producer } from "../producer";
import { AngularFireDatabase } from '@angular/fire/database';
import { LifeApp } from '../application';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Location } from "@angular/common"; // Angular service for interacting with the browser
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { DataService } from '../data.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-add-life',
  templateUrl: './add-life.component.html',
  styleUrls: ['./add-life.component.scss']
})
export class AddLifeComponent implements OnInit {

  form_title: string = "";
  button_text: string = "";
  app_id: string = ""; // if page is in edit mode, then app_id is set to app's id in database

  showMessage: Boolean = false;
  didAddApplication: Boolean = true;
  clientName = "";
  allAppRoute = "";

  producers: Producer[] = [];
  constants = {};

  private today = new Date();
  addLifeAppForm: FormGroup = this.fb.group({ });

  app_loaded = false;

  subscriptions: Subscription[] = [];

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, private dataService: DataService, public db_auth:  AngularFireAuth, private route: ActivatedRoute, private location: Location, private router: Router) { }

  ngOnInit(): void {
    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        // loads producers
        this.loadProducers();
    
        let sub2 = this.db.list('constants/life').snapshotChanges().pipe(take(1)).subscribe(
          (snapshot: any) => snapshot.map(snap => {
          this.constants[snap.payload.key] = snap.payload.val().split("_");
        }));
        this.subscriptions.push(sub2);

        this.app_id = this.route.snapshot.paramMap.get('id');
        if (this.app_id != null) {
          this.form_title = "Edit Life App";
          this.button_text = "UPDATE";
          let app_year = this.route.snapshot.paramMap.get('year');
          let app_sub = this.db.list('apps/' + app_year + '/' + this.app_id).snapshotChanges().pipe(take(1)).subscribe(
            (snapshot: any) => snapshot.map(snap => {
            this.addLifeAppForm.addControl(snap.payload.key, this.fb.control(snap.payload.val()));
            this.app_loaded = true;
          }));
          this.subscriptions.push(app_sub);
        }
      } else {
        // if user is not logged in, reroute them to the login page
        this.router.navigate(['login']);
      }
    });

    this.app_id = this.route.snapshot.paramMap.get('id');
    let todays_date: string = this.today.getFullYear() + "-";
    if (this.today.getMonth() < 9) {
      todays_date += "0" + (this.today.getMonth() + 1) + "-";
    } else {
      todays_date += (this.today.getMonth() + 1) + "-";
    }
    if (this.today.getDate() >= 10) {
      todays_date += this.today.getDate();
    } else {
      todays_date += "0" + this.today.getDate();
    }

    if (this.app_id == null) {
      this.form_title = "Add Life App";
      this.button_text = "SUBMIT";
      this.addLifeAppForm = this.fb.group({
        date: [todays_date],
        producer_id: [''],
        client_name: [''],
        premium: [0],
        mode: ['Monthly'],
        annual_premium: [0], 
        policy_type: ['Term'],
        product: ['20 Yr Term'],
        client_type: ['New'],
        bonus: [0],
        status: [''],
        paid_bonus: [0],
        life_pivot_bonus: [''],
        issue_month: [''],
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

  async loadProducers() {
    await this.dataService.until(_ => this.dataService.prod_loaded == true);
    for (const producer of this.dataService.producers) {
      if (producer.hired && producer.licensed) {
        this.producers.push(producer);
      }
    }
  }

  updateAnnualPremium() {
    let factor = 1;
    let mode = this.get("mode");
    if (mode == "Monthly") {
      factor = 12;
    }
    let annual_premium = Math.round(factor * this.get('premium') * 100) / 100;
    this.addLifeAppForm.get('annual_premium').setValue(annual_premium);
    this.updateBonus();
  }

  updateBonus() {
    let bonus = this.get('annual_premium') / 12;
    if (this.get("policy_type") == "Permanent") {
      // 20% annual premium on permanent life policies (2026 bonus structure)
      bonus = Math.round(0.20 * this.get('annual_premium') * 100) / 100;
    } else if (this.get("policy_type") == "Term") {
      // 15% annual premium on term life policies (2026 bonus structure)
      bonus = Math.round(0.15 * this.get('annual_premium') * 100) / 100;
    }
    this.addLifeAppForm.get('bonus').setValue(bonus);
    
    if (this.get("life_pivot_bonus") == "Manual") {
      // in manual mode paid bonus and co producer bonus are allowed to be manually edited
      document.getElementById('paid_bonus').removeAttribute('readonly');
      document.getElementById('co_producer_bonus').removeAttribute('readonly');
    } else if (this.get("issue_month") != "" && this.get("life_pivot_bonus") != "") {
      // if a life pivot percentage is set, then paid and co producer bonus are read only values determined by percentage
      document.getElementById('paid_bonus').setAttribute('readonly', 'true');
      document.getElementById('co_producer_bonus').setAttribute('readonly', 'true');

      let percentage = Number(this.get("life_pivot_bonus").substring(0, this.get("life_pivot_bonus").length-1)) / 100;

      // min bonus is always 25
      let main_producer_bonus = 25;
      if (percentage * bonus >= 25) {
        main_producer_bonus = Math.round(percentage * bonus * 100) / 100;
      }
      this.addLifeAppForm.get('paid_bonus').setValue(main_producer_bonus);

      if (this.get('co_producer_id') != "") {
        let co_producer_bonus = 25;
        if ((1-percentage) * bonus >= 25) {
          co_producer_bonus = Math.round((1-percentage) * bonus * 100) / 100;
        }
        this.addLifeAppForm.get('co_producer_bonus').setValue(co_producer_bonus);
      } else {
        this.addLifeAppForm.get('co_producer_bonus').setValue(0);
      }
    } else {
      this.addLifeAppForm.get('paid_bonus').setValue(0);
      this.addLifeAppForm.get('co_producer_bonus').setValue(0);
    }
  }

  get(field: string) {
    return this.addLifeAppForm.get(field).value == null ? 0 : this.addLifeAppForm.get(field).value;
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
      this.showNotification(false);
      return;
    }

    this.clientName = this.get("client_name");
    
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

    let app_with_id = app;

    if (this.app_id == null) {
      // adds new application
      let new_app_id = this.randomString(16);
      app_with_id.id = new_app_id;
      this.db.list('/apps/'+this.get("date").substring(0, 4)).update(new_app_id, app).then(() => {
        this.dataService.addApplication('life', this.get("date").substring(0, 4), app_with_id);
        this.showNotification(true);
      });
    } else {
      // updates existing application
      this.db.list('/apps/'+this.get("date").substring(0, 4)).update(this.app_id, app).then(() => {
        app_with_id.id = this.app_id;
        this.dataService.updateApplication('life', this.get("date").substring(0, 4), app_with_id);
        this.showNotification(true);
      });
    }
  }

  showNotification(success: Boolean) {
    this.didAddApplication = success;
    this.clientName = this.get("client_name");
    this.showMessage = true;
  }

  hideNotification() {
    this.showMessage = false;
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
