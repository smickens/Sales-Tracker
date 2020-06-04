import { Component, OnInit } from '@angular/core';
import { User, USERS } from "../user";
import { Color } from "ng2-charts";
import { Application } from '../application';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  users: User[] = USERS;
  bankApps: Application[] = [
    { type: "bank", name: "john smith", member: this.users[0] },
    { type: "bank", name: "jane smith", member: this.users[0] },
    { type: "bank", name: "bob johnson", member: this.users[1] }
  ];

  public barChartOptions = {
    scaleShowVerticalLines: false,
    responsive: true
  };

  public barChartLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'];
  public barChartType = 'bar';
  public barChartLegend = false;

  public barChartData = [
    {data: [65, 59, 60, 71, 56, 55, 40], label: ''}
  ];

  public barChartColors: Color[] = [
    { backgroundColor: '#f79b8b' }
  ]

  constructor() { }

  ngOnInit(): void {
  }

  toggleUser(user: User): void {
    user.showing = !user.showing;
  }

  chartClicked(): void {
    //console.log("chart clicked");
  }

  chartHovered(): void {
    //console.log("chart hovered");
  }

}
