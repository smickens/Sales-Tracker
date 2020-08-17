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

  addProducerForm = this.fb.group({
    new_producer: []
  });

  constructor(private db: AngularFireDatabase, private fb: FormBuilder) { }

  ngOnInit(): void {
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

    // have it clear input field
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
