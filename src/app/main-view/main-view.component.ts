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

  // TODO: need for co-producer on certain app types (auto, fire, bank, and health) to get 0.5 of app count

  // # of apps submitted, # of apps taken
  apps_this_year = {
    "life": [0, 0],
    "auto": [0, 0],
    "bank": [0, 0],
    "fire": [0, 0],
    "health": [0, 0],
    "mutual-funds": [0, 0]
  };

  app_types = ["life", "auto", "bank", "fire", "health", "mutual-funds"];
  app_totals_by_producer = {};
  life_dots = {};
  auto_dots = {};
  bank_dots = {};
  fire_dots = {};
  health_dots = {};

  life_totals = {};
  auto_totals = {};
  bank_totals = {};
  fire_totals = {};
  health_totals = {};

  producers: Producer[] = [];

  current_year = 0;
  current_month = "";
  months = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

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

        let date = new Date();
        this.current_year = date.getFullYear();

        // loads producers
        let producer_sub = db.list('producers').snapshotChanges().subscribe(
          (snapshot: any) => snapshot.map((snap, index) => {
            let producer: Producer = {
              name: snap.payload.val().name,
              id: snap.key
            }
            this.producers.push(producer);
            this.app_totals_by_producer[producer["id"]] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

            if (snapshot.length == index+1) {
              this.loadDots();
            }
        }));
        this.subscriptions.push(producer_sub);
      } else {
        environment.logged_in = false;
        this.router.navigate(['login']);
      }
    });
    this.subscriptions.push(auth_sub);
  }

  loadDots() {
    // loads in application totals for the year
    let app_sub = this.db.list('applications').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
        const app = snap.payload.val();
        const app_date = app["date"] as string;
        const app_year = parseInt(app_date.substring(0, 4));

        if (app_year == this.current_year) {
          const type = app["type"];
          this.apps_this_year[type][0] += 1;

          // bonus
          const issue_month = snap.payload.val().issue_month;
          const status = snap.payload.val().status as string;
          const month = Number((snap.payload.val().date as string).substring(5, 7));
          if (status == "Issued" || status == "Taken") {
            this.apps_this_year[type][1] += 1;
          }

          if (type == "life") {
            this.life_totals[month+"_total"] = (this.life_totals[month+"_total"] || 0) + 1;
            this.life_dots[app["producer_id"]+"_"+month+"_total"] = (this.life_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 1;
            if (app["status"] == "Taken") {
              this.life_dots[app["producer_id"]+"_"+month+"_issued"] = (this.life_dots[app["producer_id"]+"_"+month+"_issued"] || 0) + 1;
              if (app["issue_month"] != "") {
                this.life_dots[app["producer_id"]+"_"+issue_month+"_bonus"] = (this.life_dots[app["producer_id"]+"_"+issue_month+"_bonus"] || 0) + app["paid_bonus"];
                if (app["co_producer_id"] != "") {
                  this.life_dots[app["co_producer_id"]+"_"+issue_month+"_bonus"] = (this.life_dots[app["co_producer_id"]+"_"+issue_month+"_bonus"] || 0) + app["co_producer_bonus"];
                }
              }
            }
          }
          //console.log("Life");
          //console.log(this.life_dots);

          if (type == "auto") {
            if (app["co_producer_id"] == "") {
              this.auto_dots[app["producer_id"]+"_"+month+"_total"] = (this.auto_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 1;
            } else {
              // if there is a co-producer, then split app count
              this.auto_dots[app["producer_id"]+"_"+month+"_total"] = (this.auto_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 0.5;
              this.auto_dots[app["co_producer_id"]+"_"+month+"_total"] = (this.auto_dots[app["co_producer_id"]+"_"+month+"_total"] || 0) + 0.5;
            }
            this.auto_totals[month+"_total"] = (this.auto_totals[month+"_total"] || 0) + 1;
            if (app["auto_type"] == "RN") {
              // TODO: should it only count auto RN dot if submitted or issued
              this.auto_dots[app["producer_id"]+"_"+month+"_RN"] = (this.auto_dots[app["producer_id"]+"_"+month+"_RN"] || 0) + 1;
              this.auto_totals[month+"_RN"] = (this.auto_totals[month+"_RN"] || 0) + 1;
            } else {
              this.auto_totals[month+"_other"] = (this.auto_totals[month+"_other"] || 0) + 1;
            }
            if (app["status"] == "Submitted" || app["status"] == "Issued") {
              // TODO: should it only count auto dot if submitted or issued
              this.auto_dots[app["producer_id"]+"_"+month+"_bonus"] = (this.auto_dots[app["producer_id"]+"_"+month+"_bonus"] || 0) + app["bonus"];
            }
          }
          //console.log("Auto");
          //console.log(this.auto_dots);
          if (type == "fire") {
            this.fire_totals[month+"_total"] = (this.fire_totals[month+"_total"] || 0) + 1;
            // TODO: should it only count fire dot if submitted or issued
            if (app["status"] == "Submitted" || app["status"] == "Issued") {
              if (app["co_producer_id"] == "") {
                this.fire_dots[app["producer_id"]+"_"+month+"_total"] = (this.fire_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 1;
              } else {
                // if there is a co-producer, then split app count
                this.fire_dots[app["producer_id"]+"_"+month+"_total"] = (this.fire_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 0.5;
                this.fire_dots[app["co_producer_id"]+"_"+month+"_total"] = (this.fire_dots[app["co_producer_id"]+"_"+month+"_total"] || 0) + 0.5;
              }
            }
          }
          //console.log("Fire");
          //console.log(this.fire_dots);
          if (type == "bank") {
            this.bank_totals[month+"_total"] = (this.bank_totals[month+"_total"] || 0) + 1;
            if (app["co_producer_id"] == "") {
              this.bank_dots[app["producer_id"]+"_"+month+"_total"] = (this.bank_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 1;
            } else {
              // if there is a co-producer, then split app count
              this.bank_dots[app["producer_id"]+"_"+month+"_total"] = (this.bank_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 0.5;
              this.bank_dots[app["co_producer_id"]+"_"+month+"_total"] = (this.bank_dots[app["co_producer_id"]+"_"+month+"_total"] || 0) + 0.5;
              this.bank_dots[app["co_producer_id"]+"_"+month+"_bonus"] = (this.bank_dots[app["co_producer_id"]+"_"+month+"_bonus"] || 0) + app["co_producer_bonus"];
            }
            if (app["status"] == "Issued") {
              this.bank_dots[app["producer_id"]+"_"+month+"_bonus"] = (this.bank_dots[app["producer_id"]+"_"+month+"_bonus"] || 0) + app["bonus"];
            }
          }
          //console.log("Bank");
          //console.log(this.bank_dots);
          if (type == "health") {
            this.health_totals[month+"_total"] = (this.health_totals[month+"_total"] || 0) + 1;
            if (app["co_producer_id"] == "") {
              this.health_dots[app["producer_id"]+"_"+month+"_total"] = (this.health_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 1;
            } else {
              // if there is a co-producer, then split app count
              this.health_dots[app["producer_id"]+"_"+month+"_total"] = (this.health_dots[app["producer_id"]+"_"+month+"_total"] || 0) + 0.5;
              this.health_dots[app["co_producer_id"]+"_"+month+"_total"] = (this.health_dots[app["co_producer_id"]+"_"+month+"_total"] || 0) + 0.5;
              this.health_dots[app["co_producer_id"]+"_"+month+"_bonus"] = (this.health_dots[app["co_producer_id"]+"_"+month+"_bonus"] || 0) + app["co_producer_bonus"];
            }
            if (app["status"] == "Issued") {
              this.health_dots[app["producer_id"]+"_"+month+"_bonus"] = (this.health_dots[app["producer_id"]+"_"+month+"_bonus"] || 0) + app["bonus"];
            }
          }
          //console.log("Health");
          //console.log(this.health_dots);

          // app count
          if (type != "life" && app["co_producer_id"] != "") {
            // for non-life apps w/ co producer the app count is split
            this.app_totals_by_producer[app["producer_id"]][Number(month)-1] += 0.5;
            this.app_totals_by_producer[app["co_producer_id"]][Number(month)-1] += 0.5;
          } else {
            // full app count goes to main producer
            this.app_totals_by_producer[app["producer_id"]][Number(month)-1] += 1;
          }
        }
      })
    );
    this.subscriptions.push(app_sub);

    // loads in goals/notes
    let notes_sub = this.db.list('notes').snapshotChanges().subscribe(
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
    this.subscriptions.push(notes_sub);
  }

  ngOnInit(): void {
    let today = new Date();
    this.current_month = this.months[today.getMonth()];
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

  displayNotePopup(id: number) {
    document.getElementById('modalMessage').innerHTML = "";
    this.selected_note_id = id;
    (document.getElementById('note_to_edit') as HTMLInputElement).value = this.getNoteMessage(id);
  }

  updateNote() {

  }

  deleteNote() {
    let id = this.selected_note_id;
    this.db.list('notes/'+id).remove();
    for (let i = 0; i < this.notes.length; i++) {
      if (id == this.notes[i].id) {
        this.notes.splice(i);
        break;
      }
    }
  }

  displayConfirmDelete(id: number) {
    document.getElementById('modalMessage').innerHTML = "Press confirm to remove note \"" + this.getNoteMessage(id) + "\".";
    this.selected_note_id = id;
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
