import { Component, OnInit } from '@angular/core';
import { Color } from "ng2-charts";
import { AngularFireAuth } from '@angular/fire/auth';
import { DataService } from '../data.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  public allYearTotalChartOptions = {
    scaleShowVerticalLines: false,
    responsive: true,
    maintainAspectRatio: false
  };
  public allYearTotalChartLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  public allYearTotalChartType = 'bar';
  public allYearTotalChartLegend = false;
  public allYearTotalChartData = [{
    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
    label: ''
  }];
  public allYearTotalChartColors: Color[] = [{ 
    backgroundColor: '#E8AA9F' 
  }];

  chart_loaded = false;
  
  constructor(public db_auth:  AngularFireAuth, private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        this.loadApplications();
      }
    });
  }

  async loadApplications() {
    await this.dataService.until(_ => this.dataService.apps_loaded == true);
    this.updateChartData();
  }

  updateChartData() {
    for (const app of this.dataService.getAllApps()) {
      const status = app["status"] as string;
      if (status == "Cancelled" || status == "Declined") {
        continue;
      }

      const month = parseInt(app.date.substring(5, 7));
      this.allYearTotalChartData[0].data[month-1] += 1;
    }

    this.chart_loaded = true;
  }

  chartClicked(): void {
    //console.log("chart clicked");
  }

  chartHovered(): void {
    //console.log("chart hovered");
  }
}
