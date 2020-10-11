import { Component, OnInit } from '@angular/core';
import { Producer } from '../producer';
import { FormBuilder } from '@angular/forms';

import { AngularFireDatabase } from 'angularfire2/database';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from 'angularfire2/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bonuses',
  templateUrl: './bonuses.component.html',
  styleUrls: ['./bonuses.component.scss']
})
export class BonusesComponent implements OnInit {

  producers: Producer[] = [];
  all_producers: Producer[] = [];
  months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  production_bonuses = {};
  corporate_bonuses = {};
  
  addBonusForm = this.fb.group({
    producer_name: ['Select Producer'],
    month: [''],
    year: [''],
    corporate_bonus: [0]
  });

  add_bonus = false; // true when add bonus form is being displayed
  private today = new Date();

  subscriptions: Subscription[] = [];

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, public  db_auth:  AngularFireAuth, private router: Router) {
    let auth_sub = db_auth.authState.subscribe(user => {
      if (user) {
        environment.logged_in = true;
      } else {
        environment.logged_in = false;
        this.router.navigate(['login']);
      }
    });
    this.subscriptions.push(auth_sub);

    //  get current year
    let year = this.today.getFullYear();

    // gets list of producers
    let sub1 = db.list('producers').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
        const producer = snap.payload.val() as Producer;
        this.all_producers.push(producer);
        this.producers.push(producer);

        this.production_bonuses[producer["name"]] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.corporate_bonuses[producer["name"]] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        // gets corporate bonuses
        if ("corporate_bonuses" in snap.payload.val()) {
          if (year in snap.payload.val()["corporate_bonuses"]) {
            const corporate_bonus = producer["corporate_bonuses"][year];
            console.log(corporate_bonus);
            for (let month in corporate_bonus) {
              console.log(month + ": " + corporate_bonus[month]);
              this.corporate_bonuses[producer["name"]][parseInt(month)-1] += corporate_bonus[month];
            }
          }
        }
        //console.log(corporate_bonus);
     })
    );
    this.subscriptions.push(sub1);

    // gets production bonuses
    let sub2 = db.list('applications').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
        const app = snap.payload.val();

        const app_date = app["date"] as string;
        const app_year = parseInt(app_date.substring(0, 4));

        if (app_year == year) {
          const app_month = parseInt(app_date.substring(5, 7));
          const producer_name = app["producer_name"];
          // production bonus
          const bonus = app["bonus"];
          this.production_bonuses[producer_name][app_month-1] += bonus;

          // co-production bonus
          const co_producer_bonus = app["co_producer_bonus"];
          if (co_producer_bonus > 0 && co_producer_bonus != null) {
            const co_producer_name = app["producer_name"];
            this.production_bonuses[co_producer_name][app_month-1] += co_producer_bonus;
          }
        }
        //console.log(this.production_bonuses);
       })
    );
    this.subscriptions.push(sub2);
  }

  ngOnInit(): void {
    // sets month/year value on bonus form to current month/year
    this.addBonusForm.setValue(
      { 
        producer_name: 'Select Producer',
        month: this.months[this.today.getMonth()-1], 
        year: this.today.getFullYear(),
        corporate_bonus: 0
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  updateList(filter: string) {
    this.producers = [];
    this.db.list('producers').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
        const producer = snap.payload.val();
        console.log(producer);
        if (producer["name"] == filter || filter == "All Producers") {
          this.producers.push(producer);
        }
       })
    );
  }

  get(field: string) {
    return this.addBonusForm.get(field).value;
  }

  addBonus() {
    let producer_name = this.get("producer_name");
    let month = this.months.indexOf(this.get("month")) + 1;
    let year = this.get("year"); 
    let bonus = {};
    bonus[month] = this.get("corporate_bonus");

    if (producer_name != "Select Producer" && bonus != 0) {
      this.db.list('producers').snapshotChanges().subscribe(
        (snapshot: any) => snapshot.map(snap => {
          const producer = snap.payload.val();
          if (producer["name"] == producer_name) {
            // adds new bonus
            this.db.list('producers/'+snap.key+'/corporate_bonuses/'+year).update('/', bonus);
          }
         })
      );
    } 
      
  }

}
