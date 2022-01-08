import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Producer } from "../producer";
import { AngularFireDatabase } from '@angular/fire/database';
import { MutualFundApp } from '../application';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { DataService } from '../data.service';
import { take } from 'rxjs/operators';

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
  
  constructor(private db: AngularFireDatabase, private fb: FormBuilder, private dataService: DataService, public  db_auth:  AngularFireAuth, private route: ActivatedRoute, private router: Router) { }
  
  ngOnInit(): void {
    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        // loads producers
        this.loadProducers();

        let sub2 = this.db.list('constants/mutual-funds').snapshotChanges().pipe(take(1)).subscribe(
          (snapshot: any) => snapshot.map(snap => {
          this.constants[snap.payload.key] = snap.payload.val().split("_");
        }));
        this.subscriptions.push(sub2);

        this.app_id = this.route.snapshot.paramMap.get('id');
        if (this.app_id != null) {
          this.form_title = "Edit Mutual Funds App";
          this.button_text = "UPDATE";
          let app_year = this.route.snapshot.paramMap.get('year');
          this.db.list('apps/' + app_year + '/' + this.app_id).snapshotChanges().pipe(take(1)).subscribe(
            (snapshot: any) => snapshot.map(snap => {
              this.addMutualFundsForm.addControl(snap.payload.key, this.fb.control(snap.payload.val()));
              this.app_loaded = true;
            })
          );
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
      this.form_title = "Add Mutual Funds App";
      this.button_text = "SUBMIT";
      this.addMutualFundsForm = this.fb.group({
        date: [todays_date],
        producer_id: ['napD'],
        client_name: [''],
        product_type: ['Traditional IRA'],
        contribution_type: ['1-Time Contribution'],
        contribution_amount: [0],
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

  async loadProducers() {
    await this.dataService.until(_ => this.dataService.prod_loaded == true);
    for (const producer of this.dataService.producers) {
      if (producer.hired && producer.licensed) {
        this.producers.push(producer);
      }
    }
  }

  get(field: string) {
    return this.addMutualFundsForm.get(field).value == null ? 0 : this.addMutualFundsForm.get(field).value;
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
    if (!this.checkIfValid("contribution_amount", this.get("contribution_amount"))) {
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
        contribution_type: this.get("contribution_type"),
        contribution_amount: this.get("contribution_amount"),
        marketing_source: this.get("marketing_source")
      }
      // console.log(app);

      let app_with_id = app;
      
      if (this.app_id == null) {
        // adds new application
        let new_app_id = this.randomString(16);
        app_with_id.id = new_app_id;
        this.db.list('/apps/'+this.get("date").substring(0, 4)).update(new_app_id, app).then(() => {
          this.dataService.addApplication('mutual-funds', this.get("date").substring(0, 4), app_with_id);
          this.router.navigate(['mutual-funds/'+this.get("date").substring(0, 4)]);
        });
      } else {
        // updates existing application
        this.db.list('/apps/'+this.get("date").substring(0, 4)).update(this.app_id, app).then(() => {
          app_with_id.id = this.app_id;
          this.dataService.updateApplication('mutual-funds', this.get("date").substring(0, 4), app_with_id);
          this.router.navigate(['mutual-funds/'+this.get("date").substring(0, 4)]);
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
