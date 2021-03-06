import { Component, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { NavParams, PopoverController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { Storage } from '@ionic/storage';

import { ToastMessagingService } from '../../services/toastmessaging.service';
import { RecommendationProviderService } from '../../providers/recommendation-provider.service';

@Component({
  selector: 'app-dateselect',
  templateUrl: './dateselect.component.html',
  styleUrls: ['./dateselect.component.scss'],
})
export class DateselectComponent implements OnInit {

  /*
   * This is the date selection page used to pick up
   * a date for eat-later purpose
   */

  day = "tomorrow";
  hour = "13:30";

  pop : PopoverController = undefined;

  constructor(
    private rcmdService : RecommendationProviderService,
    private navParams : NavParams,
    private navCtrl: NavController,
    private toastMessager: ToastMessagingService,
    private storage: Storage, 
    private popoverControler : PopoverController,
  ) { 
  }

  ngOnInit() {}

  /*
   * Confirm Clicked: get the selected date, save it in storage and continue
   * to recommendation page.
   */
  async confirm() {
    // Format date
    let date = new Date();
    if(this.day == "tomorrow") 
    {
      date.setDate(date.getDate() + 1);
    } 
    if(this.day == "today" && formatDate(date, "HH:mm", 'en-US') > this.hour) 
    {
      this.toastMessager.presentToast("Please do not select past time.");
    } 
    else 
    {
      date.setHours(Number(this.hour.substring(0, 2)), Number((this.hour.substring(3))));
      let start = formatDate(date, "yyyy-MM-dd-HH-mm", 'en-US');
  
      date.setHours(date.getHours() + 1);
      let end = formatDate(date, "yyyy-MM-dd-HH-mm", 'en-US');
  
      // Store date
      this.storage.set("time_slot", {"start" : start, "end" : end} )
      .then(() => {
        this.navCtrl.navigateForward(['tabs/tabs/tab1/recommendation']);
        this.popoverControler.dismiss();
      }); 
    }
  }

}
