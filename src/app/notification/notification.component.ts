import { INFERRED_TYPE } from '@angular/compiler/src/output/output_ast';
import { Component, Input, Output, EventEmitter } from '@angular/core';

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

  @Output() dismissedEvent = new EventEmitter();

  closeMessage() {
    this.dismissedEvent.emit();
    console.log("dismiss");
  }
}
