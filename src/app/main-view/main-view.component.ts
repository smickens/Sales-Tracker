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

  addNoteForm = this.fb.group({
    note: []
  });
  notes = {};

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

    //https://github.com/angular/angularfire/issues/380
    //db.object('someLocation').take(1).subscribe();


    // loads in goals/notes

    // would look better if it ordered notes by date added

    db.list('notes').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
        if (!(snap.payload.key in this.notes)) {
          this.notes[snap.payload.key] = snap.payload.val();
        }
       })
    );
  }

  ngOnInit(): void {
  }

  onSubmit() {
    // updates notes on screen
    let note = this.addNoteForm.get('note').value;
    //this.notes.push(note);

    // updates database w/ new goal/note
    let id = this.randomString(4);

    // check id doesn't exist
    let note_object = {};
    note_object[id] = note;
    this.db.list('notes').update('/', note_object);

    // clears note input
    this.addNoteForm.setValue({'note': ''});
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
