import { Component, OnInit } from '@angular/core';
import { Producer, PRODUCERS } from "../producer";

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit {

  producers: Producer[] = PRODUCERS;

  constructor() { }

  ngOnInit(): void {
  }

  toggleUser(producer: Producer): void {
    producer.showing = !producer.showing;
  }

}
