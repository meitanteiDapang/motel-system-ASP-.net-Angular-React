import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-home-nav-bar',
  standalone: true,
  templateUrl: './navBar.html',
  styleUrls: ['../home.scss'],
})
export class HomeNavBarComponent {
  @Output() adminEntry = new EventEmitter<Event>();
}
