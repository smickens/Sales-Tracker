import { Component, OnInit } from '@angular/core';
import { Producer, PRODUCERS } from "../producer";
import { Color } from "ng2-charts";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  producers: Producer[] = PRODUCERS;

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
    { backgroundColor: '#E8AA9F' }
  ]

  constructor() { }

  ngOnInit(): void {
  }

  toggleUser(producer: Producer): void {
    producer.showing = !producer.showing;
  }

  chartClicked(): void {
    //console.log("chart clicked");
  }

  chartHovered(): void {
    //console.log("chart hovered");
  }

}
