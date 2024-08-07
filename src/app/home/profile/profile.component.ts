import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule, RouterOutlet } from '@angular/router';
import { PostComponent } from '../../widgets/post/post.component';
import { AddPostComponent } from '../../widgets/add-post/add-post.component';
import { ImageLargerComponent } from '../../widgets/image-larger/image-larger.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    PostComponent,
    AddPostComponent,
    ImageLargerComponent
    
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent   {


 
  userid: any;
  getfrommethoduserid:any;
  limit = 4;
  offset = 0;
  profileImageUrl: string = '';  
  postType: string = "";
  APIURL = 'http://127.0.0.1:8000/';
  showLargerImage: boolean = false;
  openaddpostscreenbool: boolean = false;
  username:string = "";
 
  showfeedBool:boolean = true;
  loading = false;
  showiamfolloeduserlistBool:boolean = false;
  showiamfollowinguserlistBool:boolean = false;

  user: any;
  userfrommethod:any;
  posts:any=[];
  iamfollowinguserslist: any[] = [];
  iamfolloweduserslist: any[] = [];

  constructor(private fb: FormBuilder, private http: HttpClient, private route: ActivatedRoute,private cdref: ChangeDetectorRef) { }

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {
    this.userid = params.get('uid')!;
    this.getfrommethoduserid = localStorage.getItem('wmd') || '';
    this.getUserDetails();
    this.loadInitialData();
    this.getiamfolloinguserlist(this.userid);
    this.getiamfolloeduserlist(this.userid);
    this.getuserdetailsFrommethod(this.getfrommethoduserid);
    });
 

  }

  loadInitialData(): void {
    this.posts = [];  
    this.offset = 0;  
    this.getPostsFeed();
  }
  async getuserdetailsFrommethod(userid:string):Promise<void>{
    const formData = new FormData();
    formData.append('userid', userid);

    this.http.post<any>(`${this.APIURL}get_user_details`, formData).subscribe({
      next: (response:any) => {
        
        this.userfrommethod = response;  
    
      },
      error: (error: HttpErrorResponse) => {
        console.error('There was an error!', error);
         
      }
    });
  }

 async getiamfolloeduserlist(userid: string): Promise<void> {
    const formData = new FormData();
    formData.append('userid', userid);

    this.http.post<any[]>(`${this.APIURL}get_iamfolloweduserlist`, formData).subscribe({
      next: (response: any[]) => {
        this.iamfolloweduserslist = response;

     
 
        this.iamfolloweduserslist.forEach(user => {
          if (user.profile) {
            user.profileImageUrl = this.createBlobUrl(user.profile, 'image/jpeg');
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('There was an error!', error);
      }
    });
  }


 async getiamfolloinguserlist(userid: string): Promise<void> {
    const formData = new FormData();
    formData.append('userid', userid);

    this.http.post<any[]>(`${this.APIURL}get_iamfollowinguserlist`, formData).subscribe({
      next: (response: any[]) => {
        this.iamfollowinguserslist = response;
 
        this.iamfollowinguserslist.forEach(user => {
          if (user.profile) {
            user.profileImageUrl = this.createBlobUrl(user.profile, 'image/jpeg');
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('There was an error!', error);
      }
    });
  }
 async getPostsFeed(): Promise<void> {
    if (this.loading) return;
    this.loading = true;

    const formDataUser = new FormData();
    formDataUser.append('userid', this.userid);
    formDataUser.append('limit', this.limit.toString());
    formDataUser.append('offset', this.offset.toString());

    try {
      const response = await this.http.post<any[]>(`${this.APIURL}get_posts_feed_user`, formDataUser).toPromise();
      this.posts = [...this.posts, ...this.processPosts(response!)];
      this.offset += this.limit;
      this.cdref.detectChanges();
    } catch (error) {
      console.error('There was an error!', error);
    } finally {
      this.loading = false;
    }
  }

 base64ToBlob(base64: string, contentType: string = ''): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}

createBlobUrl(base64: string, contentType: string): string {
  const blob = this.base64ToBlob(base64, contentType);
  return URL.createObjectURL(blob);
}




openaddpostscreen(type: string): void {
  this.postType = type;
  this.openaddpostscreenbool = true;
}

  getUserDetails(): void {
   


    const formData = new FormData();
    formData.append('userid', this.userid.toString());

    this.http.post<any>(`${this.APIURL}get_user_details`, formData).subscribe({
      next: (response:any) => {
        
        this.user = response; 
        this.username = response.username;
   

  
      },
      error: (error: HttpErrorResponse) => {
        console.error('There was an error!', error);
         
      }
    });
  }



@HostListener('window:scroll', ['$event'])
onScroll(event: Event): void {
    const element = document.documentElement;
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
  
        this.getPostsFeed();
    }
}

private processPosts(posts: any[]): any[] {
    const processedPosts: any[] = [];
    posts.forEach(post => {
        const existingPost = this.posts.find((p: { postid: any; }) => p.postid === post.postid);

        if (existingPost) {
            if (post.image) {
                existingPost.images.push(post.image);
            }
        } else {
            const newPost = {
                ...post,
                images: post.posttype === 'image' && post.image ? [post.image] : []
            };
            processedPosts.push(newPost);
        }
    });

    return processedPosts;
}








onImageClick(): void {
  this.showLargerImage = true;
}

 
onCloseLargerImage(): void {
  this.showLargerImage = false;
}
onPostAdded(): void {
  this.getPostsFeed();  
}




showfeed():void{
  this.showfeedBool = true;
  this.showiamfolloeduserlistBool = false;
  this.showiamfollowinguserlistBool = false;
}
 

showiamfollowinguserlist():void{
  this.showfeedBool = false;
  this.showiamfolloeduserlistBool = false;
  this.showiamfollowinguserlistBool = true;
}

showiamfolloeduserlist():void{
  this.showfeedBool = false;
  this.showiamfolloeduserlistBool = true;
  this.showiamfollowinguserlistBool = false;
}


 
async removeIAMFollowingUser(userid: string): Promise<void> {
 
  const result = confirm("Do you want to remove this follower?");
  if (result) {
    const formData = new FormData();
    formData.append('otheruserid', userid);
    formData.append('myuid', this.userid);

    this.http.post<any>(`${this.APIURL}remove-user-from-iamfollowing`, formData).subscribe({
        next: (response: any) => {
            if (response.message === "removed") {
              alert('User removed');
              this.getiamfolloinguserlist(this.userid);
              this.getiamfolloeduserlist(this.userid);
            }
        },
        error: (error: HttpErrorResponse) => {
            console.error('Error removing user:', error);
        }
    });
  }
}

toggleDropdown(event: MouseEvent, user: any): void {
  event.preventDefault();   
  event.stopPropagation();
  this.closeAllDropdowns(user); 
  user.showDropdown = !user.showDropdown;
  this.cdref.detectChanges();
}


@HostListener('document:click', ['$event'])
closeAllDropdowns(event: MouseEvent): void {
  this.iamfollowinguserslist.forEach(user => user.showDropdown = false);
  this.iamfolloweduserslist.forEach(user => user.showDropdown = false);
  this.cdref.detectChanges();
}



}
