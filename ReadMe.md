welcome to Mahdi's Website
2025-10-14 09:55
---
quick links to view the site 
https://mahdiyasser.site --> for the site itself 
https://mahdiyasser.site/blog --> for the site's blog
https://mahdiyasser.site/projects --> for the site's projects section
https://mahdiyasser.site/dashboard --> for the site's dashboard
---
so what is my website ? 
my website is a mix of personal portfoloio and a blog and a featured projects section
but you might say thats messy and i will tell you no because the blog have its own site
like literly you can copy the blog's file and use it alone as a website also the same 
thing for the featured projects section and dont worry again they are both
in the site but each one have its own section and pages and they also have 
a cms each one have its own CMS which you can just add /cms after your domain 
and you will see a page that let you choose between the blog's cms and the 
projects section CMS and btw this CMSs i made its not based on anything else no wordpress
no nothing and its fully modular you just will need some common sense or chatgpt 
to tell you how to change the paths so you put it anywhere but be carefull cause you 
might need to fix other path related issues but if you know what you are doing
then hell yeah why not and you might ask me what are the CMSs features and what is the 
diffrenc ? well iam here to answer so lets go 1st with the blog's cms 
so my cms is php based with html and js and css for better look 
its form based you fill fields and click publish or post i you will know 
so what is in the form
1-title
2-date
3-time
4-bio
5-content
6-thumbnail
7-images
that was the create new post form but there is more because in my CMS you can also
edit and delete so as for delete its just a button next to the post and there is a list
of all posts in the bottom and also there is a edit button next to that delete 
what does it have ?
1-title
2-date
3-time
4-bio
5-content
6-thumbnail
7-images
+ you can delete any image and upload new one and you can delete the thumbnail and 
upload a new one and also all the fields are pre-loaded with the post's content so 
you dont have to refill and the images have a pre-view so you dont get lost
and that was the blog's cms now lets go for the featured peoject's cms 
the form is like this 
0-choose project or create a new one 
1-title
2-date
3-time
4-bio
5-content
6-thumbnail
7-images
this is for the posts and after that form there is the same list of posts that is in the
blog's cms with the same editing style plus a choose project what does it mean
when you go eidt a post and change the project the post is in the post and its folder 
will be transfared to the new project and the post will now be in the new project 
but wait there is more for this CMS how to make a new project you asking 
simply scroll down to after the blog's posts list and you will see a create new
project form its simple and have this 
1-title
2-date 
3-time
4-bio
5-thimbanil
and then create and also at the bottom after it there is a list of all the projects
with delete and edit buttons for each project and the edit is same as posts you can
edit or change anything from this 

1-title
2-date 
3-time
4-bio
5-thimbanil

and it will edit and another thing the CMSs both look good and great actually and very
simple to use and you will not need any sort of programming knwoldge to use them
cause a 5 year old kid if can read and write will be able to use the CMSs
and that was for the projects and blog's CMS now lets talk about the
front end of the blog and project section so as a start i wont descripe the look 
because unlike the cms you can actually visit my website https://mahdiyasser.site
and see how it looks like so i will just descripe how it works and before that !note!
when you visit the site you are visitng the whole site so you will need to scroll
down for the projects section card and the blog card and click on either one of them 
to go to the blog but dont worry the site is sooo good you wont search for them
you will see them naturally !end note!
now lets talk about the blog 
the blog shows the posts in cards each post have a card and its also dynamic
so it reacts with how many posts you publish and how it works is like this
1-you publish a post using the CMS the CMS will add a entry for that post in the 
posts.json file with the following metadata

        "title": "<post-title",
        "date": "<yyyy-mm-dd",
        "thumbnail": "<the post's thumbnail>",
        "file": "<the link to the post>",
        "desc": "<the post's bio>"

but you dont have to worry because you dont have to touch this file ever just use 
CMS and after that entry is added the blog's main files will load it in a card with
the thumbnail,title ,date and bio all in a card and you will see this 
and in the end of the card there is a read post button you click it and you will
go to the post itself and as i said you cana just go visit my site 
https://mahdiyasser.site and see it all visually and also a note 
the posts named <1st-post> and <CMS> are using a old post design 
but  once i add more posts you will see the new design that fits the site's vibe
or you can go to the projects section all the posts there are the newest design
now that we finshed the blog lets go to the projects section so the projects section 
work like the blog but with a new feature which is the reson why this secion exists
1st lets talk aobut how it works starting from the CMS 
when you make a new project a new folder for it gets made and when you make
a post in that project it gets added in the project folder and thats it for the CMS 
now lets go for the other stuff so 
it have on the main page insted of posts cards it have projects cards with

        "title": "<project-title",
        "date": "<yyyy-mm-dd",
        "thumbnail": "<the project's thumbnail>",
        "file": "<the link to the view the project posts>",
        "desc": "<the project's bio>"

so you will see this and the main files load from the projects.json file
when you click on a project it will load all the posts that have the project's tag like
this the js file do the filtering and all that 

        "tag": "1st-project",
        "title": "1st-post",
        "date": "2025-10-14 03:31",
        "thumbnail": "\/projects\/assets\/1st-project\/images\/1st-post\/thumbnail.jpg",
        "file": "\/projects\/assets\/1st-project\/posts\/1st-post.html",
        "desc": "test test test test test test test",
        "location": "Hosh Issa, Beheira, Egypt"

and you might ask why not make a page for each project there is 1 reason
this is literly the same but less bloat actually no bload at all 
and when you open the project you will see its posts in cards with this metadata

        "tag": "1st-project",
        "title": "1st-post",
        "date": "2025-10-14 03:31",
        "thumbnail": "\/projects\/assets\/1st-project\/images\/1st-post\/thumbnail.jpg",
        "file": "\/projects\/assets\/1st-project\/posts\/1st-post.html",
        "desc": "test test test test test test test",
        "location": "Hosh Issa, Beheira, Egypt"

but the location wont apper in the cards because it make it look not organised so
the location only show up in the post itself 
that was the projects section and with that we finshed the 2 secions that took from me 
75% or more of all the work i worked on this site now lets talk about the site's main
page which i should have started with cause its basic logic 
so when you open the site it have on this order
1- a personal picture of you i call it pfp
2- 4 links to social media with images and its circles 
3- a description or lets call it a long bio
4- 3 cards each of them lead to 3 external links and each card have a image for me i use them for my servers
5- 2 cards for the blog and the projects section this cards are directory cards cause 
the blog and projects section are both in the site 
6- a footer with time line i use it as a milestone of my site timeline 
and thats it also the background is a image and how can you make this site
yours you asking ? simply you just have to in the index.html file edit the images
location and edit the metadata and the edit the links and the description
and the footer and it will be yours just dont edit the js or css cause if you do 
and you dont have experince you will have to download them again from the repo 
but if you do edit them i assume you know what you are doing and as for the blog
and the projects section its alot easier you will get in the blog's folder 
open the index.html and edit title and metadata and the footer and same for the 
projects section and if you dont know what you are doing ask a freind or chatgpt
and also for the CMSs dont edit them unless you really know what you are doing because
they are not basic html or js they are so complicated and the projects CMS is 1400 lines
and the blog's CMS is 900 lines and both are php so just dont and also for the blog
and the projects section you have to keep the assets folder not touched because the CMSs
rely on paths but you can edit the paths in the php only if you know what you are doing
and thats it this website is the work of 14 days from 2025-10-1 to 2025-10-14 
and each day i worked at least 6 hours on the site so minmum is 84 hours 
and thats it also there is a template repo for this website
https://github.com/Mahdiyasser/website-template
 and its the same as the site
and always up to date but the diffrence is that it doesnt have any of my posts or 
projects so it alot lighter than cloning the main one and also less work cause you 
wont have to clean up the posts or projects and down below there is 2 images 1 is 
for the blog's CMS and the 2 is for the projects CMS i added this images because
unlike everything else in the site you cant see the CMS unless you clone the repo 
and host the files in a apache server or ngnix server 
and also another thing there is a 3rd repo for the website which is 
the add-ons repo there you can find all the add-ons i make in the future 
https://github.com/Mahdiyasser/website-DLCs
and its very simple you clone it then open the folder and there will be other folders 
each folder is a add-on you copy the folder and put it in the main site anywhere you 
like but you will have to either add a button or card or anyway to reach it in the 
main site or just type a full url and each add-on comes with a readme file read it
before you edit the add-on or anything and a example of the add-ons which
is built-in the site is the dashboard which there is a link for it in the very top or 
just go to 
https://mahdiyasser.site/dashboard 
view it and its built-in yes but you can just delete the folder named dashboard after
you clone the repo if you dont want it and thats it enjoy.













