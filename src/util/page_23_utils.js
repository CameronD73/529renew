/*
** utility functions fopr getting data from 23andme.com origin pages
*/

function get_profileID_from_url( prefix, urlstring ) {
    let pid = '';
    let urlpos =  urlstring.indexOf( prefix );

    if ( urlpos >= 0 ) {
        let stpos = urlpos+prefix.length;
        let endpos = stpos + 16;
        pid = urlstring.substring( stpos, endpos );
        return pid;
    }
    return pid;
}

// the current profile person has details in the header menu...
function get_profile_from_header() {
    let pid = '';
    let pNameraw = 'unknown';
    // get the ID from the urls in the research menu
    const researchElems = document.getElementsByClassName("research");

    for( let i=0; i < researchElems.length; i++ ) {
        let href = researchElems[i].getAttribute( 'href');
        if ( href.length >= 18 ) {
            pid = get_profileID_from_url( "/p/", href  );
            break;
        }
    }
    const profileNameElems = document.getElementsByClassName("name");
    //data-mdv-id = "current-profile-name");

    for( let i=0; i < profileNameElems.length; i++ ) {
        let profElem = profileNameElems[i];
        let idnameType = profElem.getAttribute( 'data-mdv-id');
        if ( idnameType === "current-profile-name" ) {
            pNameraw = profElem.innerText;
            break;
        }
    }

    let prname = pNameraw.replaceAll( '\n', ' ').trim();

    return [ pid, prname];
}