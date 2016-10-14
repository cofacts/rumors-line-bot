require 'google/apis/customsearch_v1'

CX = ENV['GSE_ID']
KEY = ENV['GSE_KEY']

RUMOR_KEYWORDS = %w{謠言 流言 傳言 假的}

# Given a message to search,
# Returns an array of search results.
#
def query(text)
  search = Google::Apis::CustomsearchV1::CustomsearchService.new
  search.key = KEY

  # process to space-separated, punctuation-free single line text
  #
  clean_text = text.lines.map(&:strip).join(' ').gsub(/[[:punct:]]/, ' ').gsub(/ +/, ' ')

  result = search.list_cses "#{RUMOR_KEYWORDS.join ' '} #{clean_text[0..100]}", cx: CX
  (result.items || []).select {|item|
    is_relevant(item.snippet) or is_relevant(item.title)
  }
end

def is_relevant text
  RUMOR_KEYWORDS.any? { |keyword| text.include? keyword }
end
