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
        console.log(this.app_id);

        if (this.app_id != null) {
          //console.log("edit form");
          this.form_title = "Edit Life App";
          this.button_text = "UPDATE";
          this.db.list('applications/' + this.app_id).snapshotChanges().subscribe(
            (snapshot: any) => snapshot.map(snap => {
            this.addLifeAppForm.addControl(snap.payload.key, this.fb.control(snap.payload.val()));
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
      //console.log("add form");
      this.form_title = "Add Life App";
      this.button_text = "SUBMIT";
      this.addLifeAppForm = this.fb.group({
        date: [this.today.toISOString().substr(0, 10)],
        producer_id: ['Select Producer'], // TODO: check that only main producer get app count
        client_name: [''],
        premium: [],
        mode: ['Monthly'], // TODO: if monthly take premium times 12 to get annual_premium, if annual take entire value
        annual_premium: [], // * could be read only
        policy_type: ['Term'],
        product: ['20 Yr Term'],
        client_type: ['New'],
        bonus: [], // TODO: should be calculated off of life pivot bonus (full, 80, 50, 90) min is 25 always
        status: ['Select Status'],
        paid_bonus: [], // TODO: change bonus to pull paid bonus as the amount of bonus actually paid to main producer
        life_pivot_bonuses: ['Select Pivot'],
        issue_month: ['Select Issue Month'],
        marketing_source: ['Current Client'],
        co_producer_id: ['Select Co-Producer'],
        co_producer_bonus: ['Select Pivot Bonus'] // TODO: set from (annual_premium - bonus), min is 25 always
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
    return this.addLifeAppForm.get(field).value;
  }
  
  // TODO: add validation checks on all add forms
  // * pay attention to values that are optional 
  // *    like bonus which when blank should get saved as 0
  // *    and for ones like co-producer select co-producer should change to ""
  onSubmit() {
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
      life_pivot_bonuses: this.get("life_pivot_bonuses"),
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
