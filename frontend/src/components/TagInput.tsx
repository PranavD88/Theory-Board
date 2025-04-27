import { WithContext as ReactTags } from 'react-tag-input'

const KeyCodes = {
  comma: 188,
  enter: 13,
}

const delimiters = [KeyCodes.comma, KeyCodes.enter]

type TagType = {
  id: string
  text: string
}

interface TagInputProps {
  tags: TagType[]
  setTags: (tags: TagType[]) => void
}

const TagInput = ({ tags, setTags }: TagInputProps) => {
  const handleDelete = (i: number) => {
    setTags(tags.filter((_, index) => index !== i))
  }

  const handleAddition = (tag: TagType) => {
    setTags([...tags, tag])
  }

  return (
    <div style={{ width: "100%", marginBottom: "10px" }}>
      <label style={{ 
        display: "block", 
        marginBottom: "4px", 
        fontSize: "14px",
         }}>
        Tags
      </label>
      <ReactTags
        tags={tags as any}
        handleDelete={handleDelete}
        handleAddition={handleAddition as any}
        delimiters={delimiters}
        placeholder="Add tag and press enter"
      />
    </div>
  )
}

export default TagInput
