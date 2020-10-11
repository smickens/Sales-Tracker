import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  env = environment;

  constructor(public  db_auth:  AngularFireAuth) { }

  ngOnInit(): void {
  }

  async logout(){
    await this.db_auth.auth.signOut();
  }

}
