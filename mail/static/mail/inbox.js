document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit= send_email;  

  // By default, load the inbox
  load_mailbox('inbox');
});

function send_email(){
  const recipients1 = document.querySelector('#compose-recipients').value;
  const subject1 = document.querySelector('#compose-subject').value;
  const body1 = document.querySelector('#compose-body').value;

  fetch('/emails',{
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients1,
      subject: subject1,
      body: body1
    })

  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    load_mailbox('sent'); //load the sent mailbox only after the sent mail has been successful, if you don't do this the most recent sent mail will not load until next call.
  })
  //returns false so the form doesn't actually get submitted
  return false;
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

//could convert compose email function but I think this is more intuitive
function compose_reply(originalEmail) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = `${originalEmail.sender}`;
  document.querySelector('#compose-subject').value = `Re: ${originalEmail.subject}`;
  document.querySelector('#compose-body').value = `On ${originalEmail.timestamp}, ${originalEmail.sender} wrote: ${originalEmail.body}\n\n`;
}

function load_mailbox(mailbox) {
  //console.log("loaded mailbox");
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  // Also clears the content entirely of emails-view
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    //console.log(emails);
    emails.forEach(element => {
      const mailItem = document.createElement('div');
      mailItem.addEventListener('mouseover',()=>{  
      mailItem.style.border = '4px solid grey';
      mailItem.style.fontSize = '120%';
      })
      mailItem.addEventListener('mouseleave',()=>{
        //if(element.read){mailItem.style.backgroundColor = 'grey';}
        //else{ mailItem.style.backgroundColor = '';
      mailItem.style.border= '1px solid black';
      mailItem.style.fontSize = '100%';
      });
      mailItem.addEventListener('click',()=>load_email(element.id,mailbox));
      mailItem.className = "sent-mail";
      mailItem.innerHTML = `${element.sender} to ${element.recipients}. Subject: ${element.subject}. Date: ${element.timestamp}`
      
      mailItem.style.border = '1px solid black';
      if(element.read){mailItem.style.backgroundColor = '#CDCDCD';}

      document.querySelector('#emails-view').append(mailItem);
    });
    
  });

}


function load_email(mailid,mailbox){
  document.querySelector('#emails-view').innerHTML = '';
  
  fetch(`/emails/${mailid}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
  .then(
  fetch(`emails/${mailid}`)
  .then(response => response.json())
  .then(email =>{
    const anEmail = document.createElement('div');
    
    const meta = document.createElement('div');
    const replyButton = document.createElement('button');
    replyButton.innerHTML= "Reply";
    replyButton.addEventListener('click',() => compose_reply(email));
    const archiveButton = document.createElement('button');
    //archived or not logic
    isArchived = email.archived;
    if(mailbox != 'sent'){
      if(isArchived){
        archiveButton.innerHTML = "Unarchive"
      }
      else{
        archiveButton.innerHTML = "Archive"
      }
      archiveButton.addEventListener('click', () => {
        fetch(`/emails/${mailid}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: !isArchived
            
          })
        })
        .then(()=>{
          isArchived= !isArchived;
          if(isArchived){
            archiveButton.innerHTML = "Unarchive"
          }
          else{
            archiveButton.innerHTML = "Archive"
          }
        })
      })
    }
    //meta content
    meta.append(boldThisHTML("From: "));
    meta.append(`${email.sender}`);
    meta.append(line_break());
    meta.append(boldThisHTML("To: "));
    meta.append(`${email.recipients}`);
    meta.append(line_break());
    meta.append(boldThisHTML("Subject: "));
    meta.append(`${email.subject}`);
    meta.append(line_break());
    meta.append(boldThisHTML("Timestamp: "));
    meta.append(`${email.timestamp}`);
    meta.append(line_break());
    meta.append(replyButton);
    //meta styling
    meta.style.borderTop = '1px solid grey';
    meta.style.borderBottom = '1px solid grey';    
    meta.style.paddingTop = '15px';
    meta.style.paddingBottom = '15px';
    
    
    const emailBody = document.createElement('div');
    //body content
    emailBody.innerHTML = `${email.body}`;
    //body styling
    emailBody.style.fontSize = '28px';
    
    
    if(mailbox != 'sent'){anEmail.append(archiveButton);}
    
    anEmail.append(meta);
    anEmail.append(emailBody);
    document.querySelector('#emails-view').append(anEmail);
    
    
  })
  );

  //helper functions to make other code a bit easier to read.
  function boldThisHTML(str){
    const bolded = document.createElement('b')
    bolded.innerHTML = str;
    return bolded;
  }
  
  function line_break(){
    return document.createElement('br');
  }
  
  
}