import { Component, OnInit } from '@angular/core';
import { Producer } from "../producer";

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit {

  producers: Producer[];

  constructor() { }

  ngOnInit(): void {
  }

  toggleUser(producer: Producer): void {
    producer.showing = !producer.showing;
  }

}
