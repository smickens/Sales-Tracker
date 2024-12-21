import { INFERRED_TYPE } from '@angular/compiler/src/output/output_ast';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent {
  @Input() isSuccess: Boolean;
  @Input() shouldDisplay: Boolean;
  @Input() name: string;
  @Input() returnToLink: string;
  @Input() curMonth: string;

  @Output() dismissedEvent = new EventEmitter();

  constructor(private location: Location) {}

  closeMessage() {
    this.dismissedEvent.emit();
  }

  goBack() {
    this.location.back();
  }
}
