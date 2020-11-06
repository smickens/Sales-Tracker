import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

import { AngularFireAuth } from '@angular/fire/auth';

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
    await this.db_auth.signOut();
  }

}
