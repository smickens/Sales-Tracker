import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-bonuses',
  templateUrl: './bonuses.component.html',
  styleUrls: ['./bonuses.component.scss']
})
export class BonusesComponent implements OnInit {

  producers = [];
  headers = [];

  constructor() { }

  ngOnInit(): void {
  }

  updateList() {
    
  }

}
