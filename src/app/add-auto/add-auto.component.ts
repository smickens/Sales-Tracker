import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Producer } from "../producer";
import { AngularFireDatabase } from '@angular/fire/database';
import { AutoApp } from '../application';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Location } from "@angular/common"; // Angular service for interacting with the browser
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { DataService } from '../data.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-add-auto',
  templateUrl: './add-auto.component.html',
  styleUrls: ['./add-auto.component.scss']
})
export class AddAutoComponent implements OnInit {
  
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
  addAutoAppForm: FormGroup = this.fb.group({ });

  app_loaded = false;

  subscriptions: Subscription[] = [];

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, private dataService: DataService, public  db_auth:  AngularFireAuth, private route: ActivatedRoute, private location: Location, private router: Router) { }

  ngOnInit(): void {
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

    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        // loads producers
        this.loadProducers();
    
        let sub2 = this.db.list('constants/auto').snapshotChanges().pipe(take(1)).subscribe(
          (snapshot: any) => snapshot.map(snap => {
          this.constants[snap.payload.key] = snap.payload.val().split("_");
        }));
        this.subscriptions.push(sub2);

        if (this.app_id != null) {
          //console.log("edit form");
          this.form_title = "Edit Auto App";
          this.button_text = "UPDATE";
          let app_year = this.route.snapshot.paramMap.get('year');
          let app_sub = this.db.list('apps/' + app_year + '/' + this.app_id).snapshotChanges().pipe(take(1)).subscribe(
            (snapshot: any) => snapshot.map(snap => {
            this.addAutoAppForm.addControl(snap.payload.key, this.fb.control(snap.payload.val()));
            this.app_loaded = true;
          }));
          this.subscriptions.push(app_sub);
        }
      } else {
        // if user is not logged in, reroute them to the login page
        this.router.navigate(['login']);
      }
    });

    if (this.app_id == null) {
      //console.log("add form");
      this.form_title = "Add Auto App";
      this.button_text = "SUBMIT";
      this.addAutoAppForm = this.fb.group({
        date: [todays_date],
        producer_id: [''],
        client_name: [''],
        auto_type: ['RN'],
        tiers: ['Tier 1'], // * only needed if RN otherwise be 0
        bonus: [5],
        submitted_premium: [0], // keep manual
        status: ['Submitted'],
        issued_premium: [0], 
        marketing_source: ['Current Client'], // * CHECK for more options with mom
        co_producer_id: ['']
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

  isIssued(status: string) {
    if (status == "Issued") {
      this.addAutoAppForm.get('issued_premium').setValue(this.get('submitted_premium'));
    }
  }

  updateBonus() {
    let bonus = 0;
    if (this.get("auto_type") == "RN") {
      let tier = this.get("tiers");
      if (tier == "Tier 1") {
        bonus = 5;
      } else if (tier == "Tier 2") {
        bonus = 8;
      } else if (tier == "Tier 3") {
        bonus = 12;
      } else if (tier == "Tier 4") {
        bonus = 14;
      } else if (tier == "Tier 5") {
        bonus = 16;
      } else if (tier == "Tier 6") {
        bonus = 20;
      }
    }
    this.addAutoAppForm.get('bonus').setValue(bonus);
  }

  get(field: string) {
    return this.addAutoAppForm.get(field).value == null ? 0 : this.addAutoAppForm.get(field).value;
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
    if (!this.checkIfValid("auto_type", this.get("auto_type"))) {
      isValid = false;
    }
    if (!this.checkIfValid("tiers", this.get("tiers"))) {
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
    
    // otherwise it submits the form
    let app: AutoApp = {
      type: "auto",
      date: this.get("date"),
      client_name: this.get("client_name"),
      producer_id: this.get("producer_id"),
      auto_type: this.get("auto_type"),
      tiers: this.get("tiers"),
      bonus: this.get("bonus"),
      submitted_premium: this.get("submitted_premium"),
      status: this.get("status"),
      issued_premium: this.get("issued_premium"),
      marketing_source: this.get("marketing_source"),
      co_producer_id: this.get("co_producer_id")
    }
    //console.log(app);
    let year = this.get("date").substring(0, 4);
    if (this.get("auto_type") == "RN") {
      this.getTier(this.get("producer_id"), app, year);
    } else {
      this.addAutoApp(app, year);
    }
  }

  addAutoApp(app: AutoApp, year: string) {
    let app_with_id = app;
    if (this.app_id == null) {
      // adds new application
      let new_app_id = this.randomString(16);
      app_with_id.id = new_app_id;
      this.db.list('/apps/'+year).update(new_app_id, app).then(() => {
        this.dataService.addApplication('auto', this.get("date").substring(0, 4), app_with_id);
        this.showNotification(true);
      });
    } else {
      // updates existing application
      this.db.list('/apps/'+year).update(this.app_id, app).then(() => {
        app_with_id.id = this.app_id;
        this.dataService.updateApplication('auto', this.get("date").substring(0, 4), app_with_id);
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

  getTier(producer_id: string, auto_app: AutoApp, year: string) {
    // calculates producer's tier based on number of auto raw new apps
    let count = 0;
    if (this.app_id == null && auto_app["status"] != "Declined") {
      // adding new RN app
      count = 1;
    }
    // cur month is the month of the app being added/edited
    let cur_month = parseInt(auto_app['date'].substring(5, 7));
    let cur_year = parseInt(auto_app['date'].substring(0, 4));
    let raw_new_app_ids = [];
    let calculated_tier = 1;
    let bonus_values = { 1: 5, 2: 8, 3: 12, 4: 14, 5: 16, 6: 20};
    this.dataService.getApplications(cur_year).pipe(take(1)).subscribe(
      (snapshot: any) => snapshot.map((snap, index) => {
        const app = snap.payload.val();
        const app_id = snap.key;
        const app_date = app["date"] as string;
        const app_month = parseInt(app_date.substring(5, 7));
        const app_producer_id = app["producer_id"] as string;
        const app_type = app["type"] as string;
        const app_auto_type = app["auto_type"] as string;
        const app_status = app["status"] as string;
        if (app_month == cur_month && app_producer_id == producer_id && app_type == "auto" && app_auto_type == "RN") {
          let status = app_status;
          if (app_id == this.app_id) {
            status = auto_app["status"]
          }
          if (status != "Declined") {
            count += 1;
            raw_new_app_ids.push(snap.key);
            //console.log(count);
          }
        }
        if (snapshot.length == index+1) {
          if (count <= 11) {
            calculated_tier = 1; // tier 1 - up to 11 ($5 each)
          } else if (count <= 16) {
            calculated_tier = 2; // tier 2 - 12 to 16 ($8 each)
          } else if (count <= 20) {
            calculated_tier = 3; // tier 3 - 17 to 20 ($12 each)
          } else if (count <= 24) {
            calculated_tier = 4; // tier 4 - 21 to 24 ($14 each)
          } else if (count <= 29) {
            calculated_tier = 5; // tier 5 - 25 to 29 ($16 each)
          } else {
            calculated_tier = 6; // tier 6 - 30+ ($20 each)
          }
          // console.log("count - " + count, "  tier - ", calculated_tier);
          // console.log(raw_new_app_ids.length);
          raw_new_app_ids.forEach(app_id => {
            this.db.list('/apps/'+year).update(app_id, { 'tiers': "Tier " + calculated_tier, 'bonus': bonus_values[calculated_tier] });
          });
          auto_app["tiers"] = "Tier " + calculated_tier;
          auto_app["bonus"] = bonus_values[calculated_tier];
          this.addAutoApp(auto_app, year);
        }
       })
    );
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
