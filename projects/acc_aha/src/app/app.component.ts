import {Component, Injector, OnDestroy, Signal} from '@angular/core';
import {SmartOnFhirService} from "smart-on-fhir";
import * as FHIR from 'fhirclient'
import Client from "fhirclient/lib/Client";
import {Subject} from "rxjs";
import {StatefulCdsService, CdsDataService} from "common";

@Component({
  selector: 'acc_aha-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent  implements OnDestroy {

  scores: number[] = [];
  error: string | undefined;
  patient: fhir4.Patient|undefined;
  ageValid: boolean = false;

  age: number = 0;

  loadingPatientData: boolean = false;
  conceptDefinitions: { id: string, value: Signal<any>, [key: string]: any }[] = [];

  private client: Client|undefined;
  private destroy$: Subject<void> = new Subject();
  private stateChanged$: Subject<any> = new Subject();

  constructor(private sof: SmartOnFhirService, private acc_ahaService: CdsDataService,
              private injector: Injector, private statefulCdsService: StatefulCdsService) {
  }

  ngOnDestroy() {
    this.destroy$.next()
  }

  async ngOnInit() {
    this.client = await FHIR.oauth2.ready()
    this.loadingPatientData = true;
    this.patient = await this.sof.getPatient()
    this.age = (new Date().getFullYear()) - (new Date(<string>this.patient.birthDate).getFullYear())
    this.ageValid = (this.age >= 40 && this.age <=79)
    await this.acc_ahaService.init(this.client, this.patient, 'acc_aha')
    this.loadingPatientData = false
  }

  logout() {
    const launchUrl =  <string>sessionStorage.getItem('launchUrl')
    sessionStorage.clear()
    window.location.href = launchUrl
  }

}

