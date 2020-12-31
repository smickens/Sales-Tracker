import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'state-farm-app-tracker';
  display_sidebar = false;

  openSidebar() {
    this.display_sidebar = true;
    document.getElementById("sidebar").style.width = "180px";
    document.getElementById("openBtn").style.display = "none";
    document.getElementById("closeBtn").style.display = "block";
  }

  closeSidebar() {
    this.display_sidebar = false;
    document.getElementById("sidebar").style.width = "50px";
    document.getElementById("openBtn").style.display = "block";
    document.getElementById("closeBtn").style.display = "none";
  }
}
