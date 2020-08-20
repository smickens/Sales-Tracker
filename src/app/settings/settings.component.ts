import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Producer, PRODUCERS } from "../producer";
import { AngularFireDatabase } from 'angularfire2/database';
import { AutoApp } from '../application';

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
    new_constant: []
  });

  constructor(private db: AngularFireDatabase, private fb: FormBuilder) {
    this.setActive('producers');
  }

  ngOnInit(): void {
  }

  setActive(page: string) {
    this.active_page = page;
    this.headers = [];
    this.constants = [];

    // have them not keep listening

    if (this.active_page == 'producers') {
      this.headers = ["Producers"];
      this.constants[0] = [];
      this.db.list('producers').snapshotChanges().subscribe(
        (snapshot: any) => snapshot.map(snap => {
          console.log(snap.payload.val().name);
          this.constants[0].push(snap.payload.val().name);
      }));
    } else {
      this.db.list('constants/' + this.active_page).snapshotChanges().subscribe(
        (snapshot: any) => snapshot.map(snap => {
        this.headers.push(snap.key);
        this.constants.push(snap.payload.val());
      }));
    }

    // update headers array

    // update constants array
  }

  get(field: string) {
    return this.addProducerForm.get(field).value;
  }

  addProducer() {
    let producer: Producer = {
      name: this.get("new_producer"),
      life: 0,
      auto: 0,
      bank: 0,
      fire: 0,
      health: 0,
      total_apps: 0
    }

    let id = this.randomString(4);
    
    // add check that id isn't already in use

    this.db.list('/producers').update(id, producer);

    // clears input field
    this.addProducerForm.setValue({new_producer: ''});
  }

  addConstant() {
    // brings up modal, confirming addition of producer or constant
    console.log("add");
  }

  deleteConstant() {
    // brings up modal, confirming deletion of producer or constant
    console.log("delete");
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
