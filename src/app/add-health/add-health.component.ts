import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Producer } from "../producer";
import { AngularFireDatabase } from '@angular/fire/database';
import { HealthApp } from '../application';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Location } from "@angular/common"; // Angular service for interacting with the browser
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { DataService } from '../data.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-add-health',
  templateUrl: './add-health.component.html',
  styleUrls: ['./add-health.component.scss']
})
export class AddHealthComponent implements OnInit {

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
  addHealthAppForm: FormGroup = this.fb.group({ });

  app_loaded = false;

  subscriptions: Subscription[] = [];

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, private dataService: DataService, public  db_auth:  AngularFireAuth, private route: ActivatedRoute, private location: Location, private router: Router) { }

  ngOnInit(): void {
    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        // loads producers
        this.loadProducers();
    
        let sub2 = this.db.list('constants/health').snapshotChanges().pipe(take(1)).subscribe(
          (snapshot: any) => snapshot.map(snap => {
          this.constants[snap.payload.key] = snap.payload.val().split("_");
        }));
        this.subscriptions.push(sub2);

        if (this.app_id != null) {
          this.form_title = "Edit Health App";
          this.button_text = "UPDATE";
          let app_year = this.route.snapshot.paramMap.get('year');
          let app_sub = this.db.list('apps/' + app_year + '/' + this.app_id).snapshotChanges().pipe(take(1)).subscribe(
            (snapshot: any) => snapshot.map(snap => {
            this.addHealthAppForm.addControl(snap.payload.key, this.fb.control(snap.payload.val()));
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
      this.form_title = "Add Health App";
      this.button_text = "SUBMIT";
      this.addHealthAppForm = this.fb.group({
        date: [todays_date],
        producer_id: [''],
        client_name: [''],
        premium: [0],
        mode: ['Monthly'],
        status: [''],
        annual_premium: [0],
        product: ['Disability Income'],
        bonus: [0], // keep manual
        marketing_source: ['Current Client'],
        issue_month: [''],
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

  async loadProducers() {
    await this.dataService.until(_ => this.dataService.prod_loaded == true);
    for (const producer of this.dataService.producers) {
      if (producer.hired && producer.licensed) {
        this.producers.push(producer);
      }
    }
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
    this.updateBonus();
  }

  updateBonus() {
    let premium = this.get("premium");
    if (this.get("product") == "Blue Cross" || (premium > 0 && premium < 50)) {
      this.addHealthAppForm.get('bonus').setValue(50);
    } else {
      this.addHealthAppForm.get('bonus').setValue(premium);
    }
  }

  get(field: string) {
    return this.addHealthAppForm.get(field).value == null ? 0 : this.addHealthAppForm.get(field).value;
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
    if (!this.checkIfValid("product", this.get("product"))) {
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
      issue_month: this.get("issue_month"),
      co_producer_id: this.get("co_producer_id"),
      co_producer_bonus: this.get("co_producer_bonus")
    }
    //console.log(app);

    let app_with_id = app;

    if (this.app_id == null) {
      // adds new application
      let new_app_id = this.randomString(16);
      app_with_id.id = new_app_id;
      this.db.list('/apps/'+this.get("date").substring(0, 4)).update(new_app_id, app).then(() => {
        this.dataService.addApplication('health', this.get("date").substring(0, 4), app_with_id);
        this.showNotification(true);
      });
    } else {
      // updates existing application
      this.db.list('/apps/'+this.get("date").substring(0, 4)).update(this.app_id, app).then(() => {
        app_with_id.id = this.app_id;
        this.dataService.updateApplication('health', this.get("date").substring(0, 4), app_with_id);
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