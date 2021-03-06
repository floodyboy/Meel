import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { HttpClient } from '@angular/common/http';
import { Geolocation, Geoposition } from '@ionic-native/geolocation/ngx';

import {User} from '../model/users';
import {AuthenticationService} from './authentication.service';
import { ToastMessagingService } from '../services/toastmessaging.service';

@Injectable({
  providedIn: 'root'
})
export class UserinfoService {

  /*
   * Service for handling APIs related to user profile
   */

  public user = new User;

  constructor(
    private authService: AuthenticationService,
    private http: HttpClient,
    private ionicDb: Storage,
    private plt: Platform,
    private geolocation: Geolocation,
    private toastMessager: ToastMessagingService,
  ) {
    this.plt.ready().then(() => {
      this.authService.getTokenKey().then((res) => {
        if(res) {
          this.user.id = res;
          this.getLatestUserProfile();
        }
      });
    });
  }

  /*
   * Store TOEN_KEY(currently is user id) into ionic db
   * TOKEN_KEY is required for authentication service
   */
  setToken() {
    return this.ionicDb.set(this.authService.TOKEN_KEY, this.user.id);
  }

  /*
   * Return a promise of latest geoposition
   * Position data in res.coords.latitude and res.coords.longitude
   */
  getCurrentPosition() : Promise<Geoposition> {
    return this.geolocation.getCurrentPosition();
  }

  /*
   * Upload user's geographic location to server
   */
  uploadLocation() {
    return new Promise((resolve, reject) => {
      this.getCurrentPosition()
      .then((res) => {
        let body = {
          "uid" : this.user.id,
          "latitude" : res.coords.latitude,
          "longitude" : res.coords.longitude,
          "lastUpdateTime" : res.timestamp.toString()
        }
        this.user.latitude = res.coords.latitude;
        this.user.longitude = res.coords.longitude;
        console.log("Sending GPS location:", body);
        this.http.post(this.authService.apiUrl + "/eatNow/uploadLocation", 
          body, {responseType: 'text'})
        .toPromise()
        .then((res) => resolve(res))
        .catch((err) => reject(err));
      })
      .catch((err) => {
        reject(err);
      });
    });
  }

  /*
   * Get latest user profile data from server side
   * Timeout at 3000ms
   */
  getLatestUserProfile() {
    return new Promise((resolve, reject) => {
      this.http.get<any>(this.authService.apiUrl + '/userProfile/' + this.user.id)
      .subscribe(response => {
        console.log("UserinfoService: user response received, ", response);

        // todo: add and use more info
        this.user.username      = response.username;
        this.user.description   = response.description;
        this.user.email         = response.email;

        this.user.availability  = response.availability == "T";
        this.user.shareGPS      = response.shared_gps == "T";

        this.user.yearOfEntry   = response.year.toString();
        this.user.major         = response.major;
        this.user.gender        = response.gender;
        this.user.age           = response.age.toString();
        this.user.college       = response.college;
        
        resolve(true);
      }, error => {
        this.toastMessager.presentError(error);
        reject(error);
      });
      setTimeout(() => reject("Request timeout, please try again") , 3000);
    });
  }

  /* 
   * API function for fetching user profile
   */
  getUserProfile(user_id : string) : Promise<User> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(this.authService.apiUrl + '/userProfile/' + user_id)
      .toPromise()
      .then((res) => {
        var usr = res as User;
        usr.availability  = res.availability == "T";
        usr.shareGPS      = res.shared_gps == "T";
        usr.yearOfEntry   = res.year.toString();
        usr.age           = res.age.toString();
        console.log("[getUserProfile] Response received: ", usr);
        resolve(usr);
      })
      .catch((err) => reject(err));
      setTimeout(() => reject("Request timeout, please try again") , 3000);
    });
  }

  /*
   * Get user profile picture url
   */
  getUserAvatar(user_id ? : string) : string {
    if(!user_id) {
      user_id = this.user.id;
    }
    return this.authService.apiUrl + "/userProfile/" + user_id + "/image";
  }

  /* 
   * Post current user profile to server side
   */
  uploadUserProfile() {
    // Upload current location
    this.uploadLocation().catch((err) => console.log(err));
    return new Promise((resolve, reject) => {
      console.log("Sending user profile:", this.user.toJSON());
      this.http.post(this.authService.apiUrl + '/updateProfile', {}, 
      {params: this.user.toJSON(), responseType: 'text'})
      .subscribe((response) => {
        console.log(response);
        resolve(true);
      }, (error) => {
        console.log("Update profile error: ", error);
        reject(error);
      });
      setTimeout(() => reject("Request timeout, please try again") , 3000);
    });

  }

  /* 
   * Clean current user when logout
   */
  cleanUserProfile() {
    this.user = new User;
  }

}
