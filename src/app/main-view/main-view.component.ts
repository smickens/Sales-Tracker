import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Producer, PRODUCERS } from "../producer";
import { AngularFireDatabase } from 'angularfire2/database';

@Component({
  selector: 'app-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.scss']
})
export class MainViewComponent implements OnInit {

  // # of apps submitted, # of apps taken
  apps_this_year = {
    life: [0, 0],
    auto: [0, 0],
    bank: [0, 0],
    fire: [0, 0],
    health: [0, 0]
  };

  constructor(private db: AngularFireDatabase) {
    this.db.list('applications').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
        const type = snap.payload.val().type as string;
        this.apps_this_year[type][0] += 1;
        const status = snap.payload.val().status as string;
        if (status == "Issued" || status == "Taken") {
          this.apps_this_year[type][1] += 1;
        }
       })
    );
  }

  ngOnInit(): void {
  }

}

/*this.db.list('/applications', ref => ref.orderByChild('date').equalTo('August'))
  .snapshotChanges().subscribe(
    (snapshot: any) => snapshot.map(snap => {
      const data = snap.payload.val();
      const id = snap.payload.id;
      console.log(data);
      //console.log(id);
      return { id, ...data };
     })
  );*/