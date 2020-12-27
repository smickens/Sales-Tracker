import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ChartsModule } from 'ng2-charts';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { environment } from 'src/environments/environment';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { MainViewComponent } from './main-view/main-view.component';
import { SettingsComponent } from './settings/settings.component';
import { AddLifeComponent } from './add-life/add-life.component';
import { AppsListComponent } from './apps-list/apps-list.component';
import { AddAutoComponent } from './add-auto/add-auto.component';
import { AddBankComponent } from './add-bank/add-bank.component';
import { AddFireComponent } from './add-fire/add-fire.component';
import { AddHealthComponent } from './add-health/add-health.component';
import { BonusesComponent } from './bonuses/bonuses.component';
import { LoginComponent } from './login/login.component';
import { TimesheetComponent } from './timesheet/timesheet.component';
import { AddMutualFundComponent } from './add-mutual-fund/add-mutual-fund.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    SidebarComponent,
    MainViewComponent,
    SettingsComponent,
    AddLifeComponent,
    AppsListComponent,
    AddAutoComponent,
    AddBankComponent,
    AddFireComponent,
    AddHealthComponent,
    BonusesComponent,
    LoginComponent,
    TimesheetComponent,
    AddMutualFundComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ChartsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    ReactiveFormsModule,
    DragDropModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
