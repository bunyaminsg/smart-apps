import { Component } from '@angular/core';
import * as FHIR from 'fhirclient'
import {CONFIG} from "../../config";

@Component({
  selector: 'lib-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  externalLinks = CONFIG.externalLinks;

  login() {
    FHIR.oauth2.authorize(CONFIG.clientSettings).then(console.log, console.error);
  }
}
