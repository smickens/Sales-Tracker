import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Producer } from "../producer";
import { AngularFireDatabase } from '@angular/fire/database';
import { BankApp } from '../application';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Location } from "@angular/common"; // Angular service for interacting with the browser
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { DataService } from '../data.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-add-bank',
  templateUrl: './add-bank.component.html',
  styleUrls: ['./add-bank.component.scss']
})
export class AddBankComponent implements OnInit {

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
  addBankAppForm: FormGroup = this.fb.group({ });

  app_loaded = false;

  subscriptions: Subscription[] = [];

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, private dataService: DataService, public  db_auth:  AngularFireAuth, private route: ActivatedRoute, private location: Location, private router: Router) { }

  ngOnInit(): void {
    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        // loads producers
        this.loadProducers();
    
        let sub2 = this.db.list('constants/bank').snapshotChanges().pipe(take(1)).subscribe(
          (snapshot: any) => snapshot.map(snap => {
          this.constants[snap.payload.key] = snap.payload.val().split("_");
        }));
        this.subscriptions.push(sub2);

        this.app_id = this.route.snapshot.paramMap.get('id');
        //console.log(this.app_id);
        if (this.app_id != null) {
          this.form_title = "Edit Bank App";
          this.button_text = "UPDATE";
          let app_year = this.route.snapshot.paramMap.get('year');
          let app_sub = this.db.list('apps/' + app_year + '/' + this.app_id).snapshotChanges().pipe(take(1)).subscribe(
            (snapshot: any) => snapshot.map(snap => {
            this.addBankAppForm.addControl(snap.payload.key, this.fb.control(snap.payload.val()));
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
      this.form_title = "Add Bank App";
      this.button_text = "SUBMIT";
      this.addBankAppForm = this.fb.group({
        date: [todays_date],
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

  async loadProducers() {
    await this.dataService.until(_ => this.dataService.prod_loaded == true);
    for (const producer of this.dataService.producers) {
      if (producer.hired && producer.licensed) {
        this.producers.push(producer);
      }
    }
  }

  get(field: string) {
    return this.addBankAppForm.get(field).value == null ? 0 : this.addBankAppForm.get(field).value;
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
      this.showNotification(false);
      return;
    }

    this.clientName = this.get("client_name");

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

    let app_with_id = app;

    if (this.app_id == null) {
      // adds new application
      let new_app_id = this.randomString(16);
      app_with_id.id = new_app_id;
      this.db.list('/apps/'+this.get("date").substring(0, 4)).update(new_app_id, app).then(() => {
        this.dataService.addApplication('bank', this.get("date").substring(0, 4), app_with_id);
        this.showNotification(true);
      });
    } else {
      // updates existing application
      this.db.list('/apps/'+this.get("date").substring(0, 4)).update(this.app_id, app).then(() => {
        app_with_id.id = this.app_id;
        this.dataService.updateApplication('bank', this.get("date").substring(0, 4), app_with_id);
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
