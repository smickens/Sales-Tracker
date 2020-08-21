import { Component, OnInit } from '@angular/core';
import { Producer } from '../producer';

import { AngularFireDatabase } from 'angularfire2/database';

@Component({
  selector: 'app-bonuses',
  templateUrl: './bonuses.component.html',
  styleUrls: ['./bonuses.component.scss']
})
export class BonusesComponent implements OnInit {

  producers: Producer[];
  months = ["Jan", "Feb", "March", "April", "May", "June", "July", "August", "Sept", "Oct", "Nov", "Dec"];

  constructor(private db: AngularFireDatabase) {
    // gets production bonuses
    db.list('applications').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
        const app = snap.payload.val();
        console.log(app);
        // if (app["type"] == "life") {
        //   this.life_apps.push(app as LifeApp);
        // } else if (app["type"] == "auto") {
        //   this.auto_apps.push(app as AutoApp);
        // } else if (app["type"] == "bank") {
        //   this.bank_apps.push(app as BankApp);
        // } else if (app["type"] == "fire") {
        //   this.fire_apps.push(app as FireApp);
        // } else if (app["type"] == "health") {
        //   this.health_apps.push(app as HealthApp);
        // }
        const app_id = snap.key;
        console.log(app_id);
        app.id = app_id;
       })
    );

    // gets corporate bonuses

    // thinking ab storing these on producer in branch called corporate_bonus and it would store a value and date

    // 2020
       // May: 5
  }

  ngOnInit(): void {
  }

  updateList() {
    
  }

}
