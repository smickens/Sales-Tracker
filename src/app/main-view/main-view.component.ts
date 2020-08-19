import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Producer, PRODUCERS } from "../producer";
import { AngularFireDatabase } from 'angularfire2/database';
import { runInThisContext } from 'vm';

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

  addNoteForm = this.fb.group({
    note: []
  });
  notes = ["16 Life apps by end of August", "Qualify for trip to D.C.", "Hire 2 more people"];

  constructor(private db: AngularFireDatabase, private fb: FormBuilder) {
    // loads in application totals for the year
    db.list('applications').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
        const type = snap.payload.val().type as string;
        this.apps_this_year[type][0] += 1;
        const status = snap.payload.val().status as string;
        if (status == "Issued" || status == "Taken") {
          this.apps_this_year[type][1] += 1;
        }
       })
    );

    // loads in goals/notes
  }

  ngOnInit(): void {
  }

  onSubmit() {
    // updates notes on screen
    let note = this.addNoteForm.get('note').value;
    this.notes.push(note);

    // updates database w/ new goal/note
  }

}
