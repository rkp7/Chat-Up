// collection for maintaining contacts
Contacts = new Meteor.Collection("Contacts");

// collection for profile of each user account
UserProfile = new Meteor.Collection("UserProfile");

// collection for storing chat messages
Messages = new Meteor.Collection("Messages");

// key is used to store the id of selected user for chat
key = "";

// this check whether any chat button was clicked
c = false;

// dependency for helper functon Messages
var _dep = new Deps.Dependency();

// check if client
if(Meteor.isClient){
       
    Meteor.autorun(function() {
        Meteor.subscribe("Contacts",Meteor.userId());
        Meteor.subscribe("allUsers");
        Meteor.subscribe("UserProfile",Meteor.userId());  
        Meteor.subscribe("Messages",Meteor.userId());
    });
    
    Template.tabs.rendered = function() {
        
        // to get the tabs ready
             $(function() {
                 $( "#tabs_list" ).tabs();
            });
            
        // for the sliding down add contact page
          $("#down").click(function(){
            $("#add_contact").slideToggle("slow");
          });
    };
    
    Template.contact_template1.rendered = function() {
        // for the tab change on click on chat button of contact
        $(".chat_button").click(function() {
              $("#tabs_list a[href='#chat']").tab("show");
          });
          
    };
    // helper function for displaying all contacts of a user
    Template.contact_template1.helpers({
        
        Contacts: function(){
             $(".chat_button").click(function() {
              $("#tabs_list a[href='#chat']").tab("show");
          });
          
             return Contacts.find({"user_id":Meteor.userId()});
        }
    });
    
    Template.chat_template.helpers({
       
        // helper function for displaying corresponding chat messages
        Messages: function(){        
            _dep.depend();
            return Messages.find( { $or: [{ $and: [ { "user_id": Meteor.userId()}, {"contact_id": key} ] }, { $and: [ { "user_id": key}, {"contact_id":Meteor.userId()} ]}] }, {sort: {timestamp:-1 }});

        },

        CheckContacts: function() {
            _dep.depend();
            
            var count = Contacts.find({ $or: [{ $and: [ { "user_id": Meteor.userId()}, {"contact_id": key} ] }, { $and: [ { "user_id": key}, {"contact_id":Meteor.userId()} ]}] }).count();
            
            if(count == 2)
            {
                 document.getElementById("initial_message2").style.visibility = "hidden";
                return true;
            }
            else 
            { 
                document.getElementById("initial_message2").style.visibility = "visible";
                return false;    
            }
        }
    });

    // capturing events
    Template.contact_template1.events({
       
       // for adding contact on pressing enter key
       'keyup #i1': function(event) {
            if(event.keyCode == 13)
            {
                var email = $('#i1').val();
          
                var user = Meteor.users.findOne({"emails.address": email});
                var contact = Contacts.findOne({"user_id": Meteor.userId(),"email":email});
                
                if(contact)
                {
                    document.getElementById('contact_again').style.visibility = "visible";
                }
                else
                {
                    if(user)
                    {
                        document.getElementById('contact_yes').style.visibility = "visible";
                        
                        Meteor.call("insertContacts",user);
                    }
                    else
                    {
                        document.getElementById('contact_no').style.visibility = "visible";
                        
                    }
                }
                setTimeout(hide,5000);
                $('#i1').val('');
                return false;
           }
        }
    });
    
    
    Template.chat_template.events({
        // handle event on click of send button
        'click #send_chat_button': function() {
            var message = $('#send_chat').val();
            
            if(message)
            {
                  Meteor.call("insertMessage",message,key);  
            }
            
            $('#send_chat').val('');            
        
        },
        
        // handle event on pressing enter key for sending message
        'keyup #send_chat': function(event) {
            if(event.keyCode == 13)
            {
                var message = $('#send_chat').val();
            
                if(message)
                {
                      Meteor.call("insertMessage",message,key);  
                }
                
                $('#send_chat').val('');
            
            }
        
        }
    
    });

    // hide the results obtained on searching contacts on add contact page
    function hide()
    {
        document.getElementById('contact_no').style.visibility = "hidden";
        document.getElementById('contact_yes').style.visibility = "hidden"; 
        document.getElementById('contact_again').style.visibility = "hidden";   
    }
    
    // function for storing id of contact whose chat button was clicked
    getDetails = function(value)
    {
        key = value;
         _dep.changed();
         
        c = true;
        document.getElementById("initial_message1").style.visibility = "hidden";
        Meteor.call("messageRead",key);
    }
    
    // function to remove an added contact
    remove_contact = function(value)
    {
        var contact = Contacts.findOne({"user_id": Meteor.userId(), "contact_id": value});
        Meteor.call("removeContact",contact,value);
    }
    
    // retrieve the profile information of logged in user
    getProfile = function()
    {
            var current_profile =  UserProfile.findOne({"user_id": Meteor.userId()});
            document.getElementById("profile_email").placeholder = current_profile.email;
            document.getElementById("profile_username").placeholder = current_profile.username;
            document.getElementById("profile_status").placeholder = current_profile.status;
    }

    // function for changing the username
    change_username = function()
    {
        var current_profile = UserProfile.findOne({"user_id": Meteor.userId()});
        var input_box = document.getElementById("profile_username").value;
                
        Meteor.call("changeUsername",current_profile,input_box);
        
        document.getElementById("profile_username").placeholder = current_profile.username;
                  
        location.reload(true); 
    }   
    
    // function for changing the status
    update_status = function()
    {
        var current_profile = UserProfile.findOne({"user_id": Meteor.userId()});
        var input_box = document.getElementById("profile_status").value;
            
        Meteor.call("updateStatus",current_profile,input_box);
        
        document.getElementById("profile_status").placeholder = current_profile.status;
        
        location.reload(true); 
    }
   
}

Meteor.methods({
      
      // Inserting record in UserProfile
      insertUserProfile: function (user) {
                UserProfile.insert({
                    user_id: user._id,
                    email: user.emails[0].address,
                    username: user.emails[0].address,
                    status: "New to Chat Up",
                   
                });
       },
       
       // Inserting record in Contacts
       insertContacts: function(user) {
       var profile = UserProfile.findOne({"user_id": user._id});
       Contacts.insert({
                    user_id: Meteor.userId(),
                    createdAt: new Date(),
                    contact_id:  user._id, 
                    username: profile.username,
                    email: profile.email,
                    status: profile.status,
                    read: true
                });
       },
       
       // Removing record from Contacts
       removeContact: function(contact,value) {
       
            Messages.remove( { $or: [{ $and: [ { "user_id": Meteor.userId()}, {"contact_id": value} ] }, { $and: [ { "user_id": value}, {"contact_id":Meteor.userId()} ]}] });
            Contacts.remove(contact._id);
            
       },
    
       // Queries following change of username
       changeUsername: function(current_profile,input_box) {
            
            UserProfile.update(current_profile._id,{$set: {"username": input_box }});
            Contacts.update({"contact_id": current_profile.user_id},{$set: {"username": input_box}},{multi: true}); 
            Messages.update({"user_id": current_profile.user_id},{$set: {"user_username": input_box}},{multi: true});
       },
        
       // Queries following updation of status 
       updateStatus: function(current_profile,input_box)
       {
            UserProfile.update(current_profile._id,{$set: {"status": input_box }});  
            Contacts.update({"contact_id": current_profile.user_id},{$set: {"status": input_box}},{multi: true});  
       },
       
       // Inserting record in Messages
       insertMessage: function(message,key) {
       var profile = UserProfile.findOne({"user_id": Meteor.userId()});
        
       Messages.insert({
                user_id: Meteor.userId(),
                user_username: profile.username,
                user_email: profile.email,
                contact_id: key,
                chat: message,
                timestamp: Date.now()
                });
                
       Contacts.update({"user_id": key, "contact_id": Meteor.userId()},{$set: {"read": false}});
       },
       
       // Updating whether message sent was read
       messageRead: function(key) {
            Contacts.update({"user_id": Meteor.userId(), "contact_id": key},{$set: {"read": true}});
       },
       
       contactCount: function() {
            return Contacts.find({ $or: [{ $and: [ { "user_id": Meteor.userId()}, {"contact_id": key} ] }, { $and: [ { "user_id": key}, {"contact_id":Meteor.userId()} ]}] }).count();
       
       }
       
});

// permissions granted to client for Contacts collection      
Contacts.allow({
  insert: function (userId, contact) {
    
    return contact.user_id === userId;
  },
  remove: function (userId, contact) {
   
    return contact.user_id === userId;
  }
 
});  

// permissions granted to client for UserProfile collection 
UserProfile.allow({
  
  update: function (userId,profile) {
  
    return profile.user_id === userId;
  }
});   

// permissions granted to client for Messages collection 
Messages.allow({
  
  insert: function (userId,message) {
  
    return message.user_id === userId;
  }
});    

// check if server
if (Meteor.isServer) {

  process.argv = _.without(process.argv, '--keepalive');
  Meteor.startup(function () { console.log("LISTENING"); });
  
  // Publish required records from Contacts
  Meteor.publish("Contacts", function (id) {
    
        if(id)
            return Contacts.find();
  });
  
  // Publish required records from users
  Meteor.publish("allUsers", function () {
    return Meteor.users.find({});
  });
  
  // Publish required records from UserProfile
  Meteor.publish("UserProfile", function (id) {
  
    if(id)
        return UserProfile.find({"user_id": id});
  });
  
  // Publish required records from Messages
  Meteor.publish("Messages", function (id) {
        if(id)
            return Messages.find({});
  });
  
  // Create a Profile for each user account
  Accounts.onCreateUser(function(options, user) {
      
      if (options.profile)
            user.profile = options.profile;       
      
      Meteor.call("insertUserProfile", user);
                    
      return user;
  });
  
  // send a verification mail on account creation
  Accounts.config({
    sendVerificationEmail: true
  });
}

