import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Producer } from "../producer";
import { AngularFireDatabase } from 'angularfire2/database';
import { AutoApp } from '../application';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from 'angularfire2/auth';
import { Subscription } from 'rxjs';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  active_page = 'producers';
  headers = [];
  constants = [];

  addProducerForm = this.fb.group({
    new_producer: []
  });
  addConstantForm = this.fb.group({
    new_constant: [],
    header: []
  });

  subscription: Subscription;

  movies = [
    'Episode I - The Phantom Menace',
    'Episode II - Attack of the Clones',
    'Episode III - Revenge of the Sith',
    'Episode IV - A New Hope',
    'Episode V - The Empire Strikes Back',
    'Episode VI - Return of the Jedi',
    'Episode VII - The Force Awakens',
    'Episode VIII - The Last Jedi',
    'Episode IX – The Rise of Skywalker'
  ];

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, public  db_auth:  AngularFireAuth, private router: Router) {
    this.subscription = db_auth.authState.subscribe(user => {
      if (user) {
        environment.logged_in = true;
      } else {
        environment.logged_in = false;
        this.router.navigate(['login']);
      }
    });

    this.setActive('producers');
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  setActive(page: string) {
    this.active_page = page;
    this.headers = [];
    this.constants = [[]];

    // have them not keep listening
    // .unsubscribe() ends the listening but need a way to know when they're finished first

    if (this.active_page == 'producers') {
      this.headers = ["Producers"];
      this.db.list('producers').snapshotChanges().subscribe(
        (snapshot: any) => snapshot.map(snap => {
          let displayed = false;
          this.constants[0].forEach(producer => {
            if (producer[0] == snap.key) {
              displayed = true;
            }
          });

          if (!displayed) {
            this.constants[0].push([snap.key, snap.payload.val().name]);
          }
          //console.log(this.constants);
      }));
    } else {
      this.db.list('constants/' + this.active_page).snapshotChanges().subscribe(
        (snapshot: any) => snapshot.map(snap => {
        let header = snap.key as string;
        if (this.headers.includes(header.split("_").join(" ")) == false) {
          this.headers.push(header.split("_").join(" "));
        }
        while (this.constants.length < this.headers.length) {
          this.constants.push([]);
        }
        let index = this.headers.indexOf(header.split("_").join(" "));
        if (this.constants[index] != snap.payload.val().split("_")) {
          this.constants[index] = snap.payload.val().split("_");
        }
      }));
    }
  }

  get(form: FormGroup, field: string) {
    return form.get(field).value;
  }

  addProducer() {
    let name = this.get(this.addProducerForm, "new_producer");
    if (name.trim() != "") {
      let producer: Producer = {
        name: this.get(this.addProducerForm, "new_producer"),
        life: 0,
        auto: 0,
        bank: 0,
        fire: 0,
        health: 0,
        total_apps: 0
      }

      let id = this.randomString(4);
      
      // add check that id isn't already in use
      

      this.db.list('producers').update(id, producer);

      // clears input field
      this.addProducerForm.setValue({new_producer: ''});
      this.addConstantForm.setValue({new_constant: '', header: ''});
    }
  }

  deleteProducer(id: number, constant_index: number) {
    console.log("delete producer " + id);
    this.db.list('producers/' + id).remove();
    this.constants[0].splice(constant_index, 1);
  }

  addConstant() {
    // brings up modal, confirming addition of producer or constant
    let app_type = this.active_page;
    let header = this.get(this.addConstantForm, 'header').toLowerCase();
    let new_constant = this.get(this.addConstantForm, 'new_constant');

    let header_index = this.headers.indexOf(header.toLowerCase());
    this.constants[header_index].push(new_constant);

    let constant = {};
    constant[header.split(" ").join("_")] = this.constants[header_index].join("_");
    this.db.list('constants/' + app_type + '/').update('/', constant);
  }

  deleteConstant(header_index: number, constant_index: number) {
    // brings up modal, confirming deletion of producer or constant
    let app_type = this.active_page;
    let header = this.headers[header_index];

    // removes constant from array
    this.constants[header_index].splice(constant_index, 1);

    // updates database with removed
    let constant = {};
    constant[header] = this.constants[header_index].join("_");
    if (this.active_page == "producers") {
      this.db.list('producers/' + app_type + '/').update('/', constant);
    } else {
      this.db.list('constants/' + app_type + '/').update('/', constant);
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

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.movies, event.previousIndex, event.currentIndex);
  }

}
