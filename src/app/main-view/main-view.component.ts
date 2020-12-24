import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { environment } from 'src/environments/environment';

import { Producer } from "../producer";
import { AngularFireDatabase } from '@angular/fire/database';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

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
  notes = [];
  notes_keys = {};

  selected_note_id = 0

  subscriptions: Subscription[] = [];

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, public  db_auth:  AngularFireAuth, private router: Router) {
    let auth_sub = db_auth.authState.subscribe(user => {
      if (user) {
        environment.logged_in = true;

        // loads in application totals for the year
        let sub1 = db.list('applications').snapshotChanges().subscribe(
          (snapshot: any) => snapshot.map(snap => {
            const type = snap.payload.val().type as string;
            this.apps_this_year[type][0] += 1;
            const status = snap.payload.val().status as string;
            if (status == "Issued" || status == "Taken") {
              this.apps_this_year[type][1] += 1;
            }
          })
        );
        this.subscriptions.push(sub1);

        // loads in goals/notes
        let sub2 = db.list('notes').snapshotChanges().subscribe(
          (snapshot: any) => snapshot.map(snap => {
            let displayed = false;
            this.notes.forEach(note => {
              if (snap.payload.key == note.id) {
                displayed = true;
              }
            });
            if (!displayed) {
              let note_object = { 
                id: snap.payload.key,
                text: snap.payload.val()['text'],
                date: snap.payload.val()['date']
              };
              this.notes.push(note_object);
              this.notes.sort((a, b) => a.date - b.date);
          };
          })
        );
        this.subscriptions.push(sub2);
      } else {
        environment.logged_in = false;
        this.router.navigate(['login']);
      }
    });
    this.subscriptions.push(auth_sub);
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  addNote() {
    // updates notes on screen
    let note = this.addNoteForm.get('note').value;

    // check id doesn't exist
    let id = "";
    console.log(this.notes);
    while (id in this.notes || id == "") {
      id = this.randomString(4);
    }
    
    // updates database w/ new goal/note
    let time = new Date();
    let note_object = {};
    note_object[id] = {
      text: note,
      date: time.getTime()
    };
    this.db.list('notes').update('/', note_object);

    // clears note input
    this.addNoteForm.setValue({'note': ''});
  }

  deleteNote() {
    let id = this.selected_note_id
    this.db.list('notes/'+id).remove();
    for (let i = 0; i < this.notes.length; i++) {
      if (id == this.notes[i].id) {
        this.notes.splice(i);
        break;
      }
    }
  }

  displayConfirmDelete(id: number) {
    document.getElementById('modalDeleteMessage').innerHTML = "Press confirm to remove note \"" + this.getNoteMessage(id) + "\".";
    this.selected_note_id = id
  }

  getNoteMessage(id: number) {
    for (let i = 0; i < this.notes.length; i++) {
      if (id == this.notes[i].id) {
        return this.notes[i].text
      }
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

// this.db.list('notes').query.orderByKey().once('value').then(function(snapshot) {
    //   snapshot.forEach(function(snap) {
    //     console.log(snap.key);
    //     console.log(snap.val());
    //   });
    // });
    // db.list('notes').query.orderByChild('date').on('child_added', function(snap) {
    //   if (!(snap.key in testing_notes)) {
    //     testing_notes[snap.key] = snap.val()['text'];
    //   }
    //   console.log(testing_notes);
    // });
    // db.list('notes').query.orderByChild('date').on('child_added', function(snap) {
    //   console.log(snap.key);
    //   console.log(snap.val());
    //   let key = snap.key as string;
    //   //this.notes["test"] = "here";
    //   console.log(this.notes);
    //   // if (!("key" in this.notes)) {
    //   //   this.notes[snap.key] = snap.val();
    //   // }
    // }); 
    
    //.once('value').then(function(snapshot) {
    //   snapshot.forEach(function(snap) {
    //     console.log(snap.val());
    //   });
    // });
